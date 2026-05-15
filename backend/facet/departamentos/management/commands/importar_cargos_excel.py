"""Importa el listado de cargos del Excel `e_*.xls` (HTML) a la base de datos.

Crea/actualiza Persona, Docente o NoDocente (según `agrupamiento`), TipoCargo
(según descrip + dedicacion), Cargo (según nrocargo) y CargoHistorial
(según fechaalta/fechabaja).

Uso:
    python manage.py importar_cargos_excel ruta/al/archivo.xls
    python manage.py importar_cargos_excel ruta/al/archivo.xls --dry-run
    python manage.py importar_cargos_excel ruta/al/archivo.xls --limit 50
"""
from __future__ import annotations

import re
from datetime import datetime, date
from typing import Optional

import pandas as pd
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Model as DjangoModel
from django.utils import timezone

from departamentos.models import (
    Persona, Docente, NoDocente, TipoCargo, Cargo, CargoHistorial,
)


# Mapping agrupamiento → rol funcional
AGRUPAMIENTOS_DOCENTE = {'DOCE'}
# Todo lo demás (ADMI, SERV, TECN, MAES, AUT1, PROF, ...) cae a NoDocente.


def cuil_a_dni(cuil) -> Optional[str]:
    """20425236483 → '42523648' (8 dígitos centrales).

    Acepta str o int. Devuelve None si no se puede.
    """
    if cuil is None:
        return None
    s = re.sub(r'\D', '', str(cuil))
    if len(s) == 11:
        return s[2:10]
    if len(s) == 8:
        return s
    return None


def to_date(value) -> Optional[date]:
    """Convierte pandas/str → date. Acepta NaN, None, datetime, str ISO."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, pd.Timestamp):
        return value.date()
    try:
        return pd.to_datetime(value).date()
    except Exception:
        return None


def clean_str(value, default='') -> str:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return default
    return str(value).strip()


def clean_int(value) -> Optional[int]:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


class Stats:
    def __init__(self):
        self.personas_creadas = 0
        self.personas_existentes = 0
        self.docentes_creados = 0
        self.no_docentes_creados = 0
        self.tipo_cargo_creados = 0
        self.cargos_creados = 0
        self.cargos_actualizados = 0
        self.cargos_sin_cambio = 0
        self.historiales_creados = 0
        self.historiales_existentes = 0
        self.errores = []
        self.advertencias = []
        self.filas_sin_legajo = 0
        self.filas_sin_dni = 0
        self.filas_procesadas = 0
        self.filas_saltadas = 0

    def reporte(self) -> str:
        lines = [
            '=' * 60,
            'REPORTE DE IMPORTACIÓN',
            '=' * 60,
            f'Filas procesadas:        {self.filas_procesadas}',
            f'Filas saltadas:          {self.filas_saltadas}',
            '',
            f'Personas creadas:        {self.personas_creadas}',
            f'Personas existentes:     {self.personas_existentes}',
            f'Docentes creados:        {self.docentes_creados}',
            f'NoDocentes creados:      {self.no_docentes_creados}',
            f'TipoCargo creados:       {self.tipo_cargo_creados}',
            f'Cargos creados:          {self.cargos_creados}',
            f'Cargos actualizados:     {self.cargos_actualizados}',
            f'Cargos sin cambio:       {self.cargos_sin_cambio}',
            f'Historiales creados:     {self.historiales_creados}',
            f'Historiales existentes:  {self.historiales_existentes}',
            '',
            f'Sin legajo (saltados):   {self.filas_sin_legajo}',
            f'Sin DNI (saltados):      {self.filas_sin_dni}',
        ]
        if self.advertencias:
            lines += ['', 'ADVERTENCIAS:']
            for a in self.advertencias[:20]:
                lines.append(f'  [!] {a}')
            if len(self.advertencias) > 20:
                lines.append(f'  ... ({len(self.advertencias) - 20} mas)')
        if self.errores:
            lines += ['', 'ERRORES:']
            for e in self.errores[:20]:
                lines.append(f'  [X] {e}')
            if len(self.errores) > 20:
                lines.append(f'  ... ({len(self.errores) - 20} mas)')
        lines.append('=' * 60)
        return '\n'.join(lines)


class Command(BaseCommand):
    help = 'Importa cargos y personas desde el Excel oficial.'

    def add_arguments(self, parser):
        parser.add_argument('archivo', help='Ruta al archivo .xls/.xlsx')
        parser.add_argument(
            '--dry-run', action='store_true',
            help='Simula sin escribir en la BD (rollback al final).')
        parser.add_argument(
            '--limit', type=int, default=None,
            help='Procesa solo las primeras N filas (útil para pruebas).')
        parser.add_argument(
            '--verbose-rows', action='store_true',
            help='Imprime una línea por fila procesada.')

    def handle(self, archivo, dry_run, limit, verbose_rows, *args, **kwargs):
        self.stdout.write(self.style.NOTICE(f'Leyendo {archivo}...'))
        df = self._leer_excel(archivo)
        if limit:
            df = df.head(limit)
        self.stdout.write(f'Total de filas: {len(df)}')
        if dry_run:
            self.stdout.write(self.style.WARNING('Modo DRY-RUN: cambios se revertirán.'))

        stats = Stats()
        # Cache para evitar lookups repetidos
        cache_persona = {}      # dni -> Persona
        cache_tipocargo = {}    # (descrip, dedicacion) -> TipoCargo

        try:
            with transaction.atomic():
                for idx, row in df.iterrows():
                    try:
                        self._procesar_fila(
                            row, stats, cache_persona, cache_tipocargo, verbose_rows)
                    except Exception as e:
                        stats.errores.append(f'Fila {idx}: {e}')
                        stats.filas_saltadas += 1
                if dry_run:
                    raise _Rollback()
        except _Rollback:
            pass

        self.stdout.write('')
        self.stdout.write(stats.reporte())
        if dry_run:
            self.stdout.write(self.style.WARNING('\n(DRY-RUN: nada quedó persistido.)'))

    def _leer_excel(self, archivo: str) -> pd.DataFrame:
        # El .xls que vimos es HTML disfrazado; read_html lo maneja.
        # También soportamos xlsx con read_excel.
        if archivo.lower().endswith('.xlsx'):
            return pd.read_excel(archivo)
        try:
            tables = pd.read_html(archivo)
            if not tables:
                raise CommandError('No se encontraron tablas en el archivo.')
            return tables[0]
        except ValueError as e:
            raise CommandError(f'No se pudo leer el archivo: {e}')

    def _procesar_fila(self, row, stats: Stats, cache_persona, cache_tipocargo, verbose):
        stats.filas_procesadas += 1

        # Legajo y CUIL
        legajo = clean_int(row.get('nrolegajo'))
        cuil = clean_str(row.get('cuil'))
        dni = cuil_a_dni(cuil) if cuil else None

        if not legajo:
            stats.filas_sin_legajo += 1
            stats.filas_saltadas += 1
            return
        if not dni:
            stats.filas_sin_dni += 1
            stats.advertencias.append(
                f'Legajo {legajo}: CUIL inválido o vacío, no se pudo obtener DNI.')
            stats.filas_saltadas += 1
            return

        # Persona: lookup por DNI
        persona = cache_persona.get(dni)
        if not persona:
            try:
                persona = Persona.objects.get(dni=dni)
                stats.personas_existentes += 1
            except Persona.DoesNotExist:
                fechanac = to_date(row.get('fechanac'))
                persona = Persona.objects.create(
                    nombre=clean_str(row.get('nombre')) or '(sin nombre)',
                    apellido=clean_str(row.get('apellido')) or '(sin apellido)',
                    dni=dni,
                    legajo=str(legajo),
                    fecha_nacimiento=fechanac,
                    estado='1',
                )
                stats.personas_creadas += 1
            cache_persona[dni] = persona

        # Determinar rol (Docente vs NoDocente) por agrupamiento
        agrupamiento = clean_str(row.get('agrupamiento')).upper()
        es_docente = agrupamiento in AGRUPAMIENTOS_DOCENTE

        docente = no_docente = None
        if es_docente:
            docente, created = Docente.objects.get_or_create(
                persona=persona, defaults={'estado': '1'})
            if created:
                stats.docentes_creados += 1
        else:
            # Verificar que no sea ya Docente
            if Docente.objects.filter(persona=persona).exists():
                stats.advertencias.append(
                    f'Persona DNI {dni} ya es Docente, no se crea como NoDocente '
                    f'aunque el Excel indica agrupamiento "{agrupamiento}".')
                docente = Docente.objects.get(persona=persona)
                es_docente = True
            else:
                no_docente, created = NoDocente.objects.get_or_create(
                    persona=persona, defaults={'estado': '1'})
                if created:
                    stats.no_docentes_creados += 1

        # TipoCargo: lookup por (descrip, dedicacion)
        descrip = clean_str(row.get('descrip'))
        dedicacion = clean_str(row.get('dedicacion'))
        if not descrip or not dedicacion:
            stats.advertencias.append(
                f'Legajo {legajo} cargo {row.get("nrocargo")}: '
                f'descrip o dedicacion vacíos, no se procesa cargo/historial.')
            return

        key = (descrip, dedicacion)
        tipo_cargo = cache_tipocargo.get(key)
        if not tipo_cargo:
            tipo_cargo, created = TipoCargo.objects.get_or_create(
                descripcion=descrip,
                dedicacion=dedicacion,
                defaults={'sigla': '', 'puntaje': None, 'estado': '1'},
            )
            if created:
                stats.tipo_cargo_creados += 1
                stats.advertencias.append(
                    f'TipoCargo creado sin puntaje: "{descrip}" / {dedicacion}')
            cache_tipocargo[key] = tipo_cargo

        # Cargo: lookup por numero_de_cargo
        nrocargo = clean_int(row.get('nrocargo'))
        if not nrocargo:
            stats.advertencias.append(
                f'Legajo {legajo}: nrocargo vacío, no se crea cargo/historial.')
            return

        cargo, created = Cargo.objects.get_or_create(
            numero_de_cargo=nrocargo,
            defaults={'tipo_cargo': tipo_cargo, 'estado': '1'},
        )
        if created:
            stats.cargos_creados += 1
        elif cargo.tipo_cargo_id != tipo_cargo.id:
            anterior = cargo.tipo_cargo
            cargo.tipo_cargo = tipo_cargo
            cargo.save()
            stats.cargos_actualizados += 1
            stats.advertencias.append(
                f'Cargo {nrocargo}: tipo actualizado '
                f'{anterior} → {tipo_cargo}')
        else:
            stats.cargos_sin_cambio += 1

        # CargoHistorial: crear si no existe ya uno con mismo (cargo, persona, fecha_inicio)
        fecha_inicio = to_date(row.get('fechaalta'))
        fecha_fin = to_date(row.get('fechabaja'))
        if not fecha_inicio:
            stats.advertencias.append(
                f'Cargo {nrocargo} legajo {legajo}: fechaalta vacía, no se crea historial.')
            return

        hist_filter = {
            'cargo': cargo,
            'fecha_inicio': fecha_inicio,
        }
        if es_docente:
            hist_filter['docente'] = docente
        else:
            hist_filter['no_docente'] = no_docente

        if CargoHistorial.objects.filter(**hist_filter).exists():
            stats.historiales_existentes += 1
        else:
            motivo = None
            if fecha_fin and fecha_fin <= timezone.now().date():
                motivo = 'vencimiento'
            try:
                ch = CargoHistorial(
                    cargo=cargo,
                    docente=docente,
                    no_docente=no_docente,
                    fecha_inicio=fecha_inicio,
                    fecha_fin=fecha_fin,
                    motivo_fin=motivo,
                    observaciones='Importado desde Excel.',
                    estado='1',
                )
                # Bypass del save() custom (que llama full_clean y rechaza
                # creado_por=None). Los datos vienen del Excel: confiamos.
                DjangoModel.save(ch)
                stats.historiales_creados += 1
            except Exception as e:
                stats.errores.append(
                    f'Historial cargo {nrocargo} legajo {legajo}: {e}')

        if verbose:
            tipo = 'DOC' if es_docente else 'NDOC'
            self.stdout.write(
                f'  - Legajo {legajo} [{tipo}] cargo {nrocargo} '
                f'{descrip}-{dedicacion}')


class _Rollback(Exception):
    """Excepción interna para hacer rollback en dry-run."""
