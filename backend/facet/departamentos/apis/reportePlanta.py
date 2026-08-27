"""Reporte de Planta Docente.

Reproduce, contra la base del sistema, el informe que hoy se arma a mano en
`grafo_planta_docente.html` a partir de la planilla Excel del DEEC.

La idea central: **la ocupación de un cargo no se guarda, se deriva**. Un
docente tiene N designaciones sobre un mismo `codigo_cargo`; ordenándolas por
fecha y aplicando la duración que otorga cada tipo de trámite se obtiene quién
ocupa el cargo, hasta cuándo y si está vencido. Eso es `_derivar_ocupaciones`,
y todos los tableros se calculan sobre su resultado.
"""

from collections import Counter, defaultdict
from datetime import date, timedelta

from django.db.models import Q
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import (
    Area, Asignatura, AsignaturaDocente, Designacion, Docente,
    EstadisticaAsignatura, Licencia, Seguimiento,
)

# Orden de presentación en las tablas de doble entrada.
RANGOS = ['TITULAR', 'ASOCIADO', 'ADJUNTO', 'JTP', 'ADG']
RANGO_LABEL = {
    'TITULAR': 'Titular', 'ASOCIADO': 'Asociado', 'ADJUNTO': 'Adjunto',
    'JTP': 'JTP', 'ADG': 'ADG',
}
DEDICACIONES = ['EXCL', 'SEMI', 'SIMP']
DEDICACION_LABEL = {
    'EXCL': 'Exclusiva 40h', 'SEMI': 'Semiexclusiva 20h', 'SIMP': 'Simple 10h',
}

EDAD_JUBILATORIA = 70  # tope con prórroga


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

def _edad_a(fecha_nac, hoy):
    if not fecha_nac:
        return None
    return hoy.year - fecha_nac.year - (
        (hoy.month, hoy.day) < (fecha_nac.month, fecha_nac.day))


def _sumar_anios(f, n):
    if not f or n is None:
        return None
    try:
        return f.replace(year=f.year + n)
    except ValueError:  # 29 de febrero
        return f.replace(year=f.year + n, day=28)


def _anios_entre(desde, hasta):
    if not desde:
        return None
    return round((hasta - desde).days / 365.25, 2)


def _int_param(request, nombre, defecto, minimo=None, maximo=None):
    try:
        v = int(request.query_params.get(nombre, defecto))
    except (TypeError, ValueError):
        return defecto
    if minimo is not None:
        v = max(minimo, v)
    if maximo is not None:
        v = min(maximo, v)
    return v


# ---------------------------------------------------------------------------
# derivación de ocupaciones
# ---------------------------------------------------------------------------

def _derivar_ocupaciones(designaciones_por_docente, licencias_por_docente,
                         docente_info, hoy):
    """Convierte designaciones en ocupaciones de cargo.

    Para cada (docente, codigo_cargo):
      - `estado`: vigente | licencia | cerrada
      - `fecha_vencimiento` + `fuente_vencimiento` según tres reglas, en orden:
          1. prórroga 70 años (fecha explícita, o el cumpleaños 70 del docente)
          2. última designación activa + duración de su tipo
          3. prórroga por cargo de gestión, si extiende más allá de lo anterior
      - `vencido`, `anios_en_cargo`, `anios_desde_ultima_renovacion`
    """
    ocupaciones = []

    for docente_id, desigs in designaciones_por_docente.items():
        info = docente_info.get(docente_id)
        if not info:
            continue
        fecha_nac = info['fecha_nacimiento']

        # Prórrogas por cargo de gestión: no pertenecen a un código puntual,
        # extienden todos los cargos vigentes del docente.
        gestion = [d for d in desigs if d.tipo == Designacion.PROR_CARGO_GESTION]
        fechas_gestion = [d.fecha_hasta for d in gestion if d.fecha_hasta]
        fecha_max_gestion = max(fechas_gestion) if fechas_gestion else None
        rol_gestion = gestion[-1].rol_gestion if gestion else None

        con_codigo = [d for d in desigs
                      if d.codigo_cargo and d.tipo != Designacion.PROR_CARGO_GESTION]

        por_codigo = defaultdict(list)
        for d in con_codigo:
            por_codigo[d.codigo_cargo].append(d)

        licencias = licencias_por_docente.get(docente_id, [])

        for codigo, eventos in por_codigo.items():
            pror70 = next(
                (d for d in eventos if d.tipo == Designacion.PROR_70_ANIOS), None)
            cierre = next((d for d in eventos if d.cierra_cargo), None)

            activos = sorted(
                [d for d in eventos if not d.cierra_cargo
                 and d.tipo != Designacion.PROR_70_ANIOS],
                key=lambda d: d.fecha_desde or date.min)
            primera = activos[0] if activos else None

            # El vencimiento lo fija la última designación FIRME: una que está
            # en trámite todavía no tiene instrumento, así que no puede
            # extender la vigencia. Se la reporta aparte como renovación en
            # curso. Si no hay ninguna firme, se usa la última que haya.
            firmes = [d for d in activos if not d.en_tramite]
            ultima = firmes[-1] if firmes else (activos[-1] if activos else None)
            renovacion_en_tramite = next(
                (d for d in reversed(activos) if d.en_tramite and firmes), None)

            # --- estado -----------------------------------------------------
            licencia_vigente = next(
                (l for l in licencias
                 if (l.codigo_cargo is None or l.codigo_cargo == codigo)
                 and l.vigente_a(hoy)),
                None)

            # Un cargo sólo se considera en licencia si hay una Licencia
            # cargada. Deducirlo de "existe una designación posterior en otro
            # código" sería incorrecto: tener dos cargos simultáneos es lo
            # habitual (un JTP semi y un adjunto simple, por ejemplo), y esa
            # regla los marcaría a todos como licencia.
            estado = 'vigente'
            if cierre:
                estado = 'cerrada'
            elif licencia_vigente:
                estado = 'licencia'

            # --- vencimiento ------------------------------------------------
            fecha_venc, fuente, estimado = None, None, False

            if pror70:
                if pror70.fecha_hasta:
                    fecha_venc = pror70.fecha_hasta
                    fuente = 'Prórroga 70 años (fecha explícita)'
                elif fecha_nac:
                    fecha_venc = _sumar_anios(fecha_nac, EDAD_JUBILATORIA)
                    fuente = 'Prórroga 70 años (cumpleaños 70)'
                    estimado = True

            if fecha_venc is None and ultima:
                f, fte = ultima.vencimiento_estimado()
                if f:
                    fecha_venc, fuente = f, fte
                    estimado = ultima.fecha_hasta is None

            # La prórroga por cargo de gestión sostiene el cargo mientras el
            # docente ejerce la función, y eso incluye los cargos en licencia
            # (que es justamente el caso típico: el Decano pide licencia sin
            # goce de su cargo docente). Sólo no aplica a cargos cerrados.
            if fecha_max_gestion and estado in ('vigente', 'licencia'):
                if fecha_venc is None or fecha_max_gestion > fecha_venc:
                    fecha_venc = fecha_max_gestion
                    fuente = 'Prórroga por cargo de gestión'
                    estimado = False

            tipo_cargo = (ultima.tipo_cargo if ultima and ultima.tipo_cargo
                          else next((d.tipo_cargo for d in eventos if d.tipo_cargo), None))

            areas = sorted({d.area.nombre for d in eventos if d.area})
            asignaturas = sorted({d.asignatura.nombre for d in eventos if d.asignatura})

            ocupaciones.append({
                'id': f'OC-{docente_id}-{codigo}',
                'docente_id': docente_id,
                'docente': info['nombre_completo'],
                'dni': info['dni'],
                'legajo': info['legajo'],
                'estado_docente': info['estado_agente'],
                'codigo_cargo': codigo,
                'tipo_cargo_id': tipo_cargo.id if tipo_cargo else None,
                'denominacion': tipo_cargo.denominacion if tipo_cargo else f'Código {codigo}',
                'rango': tipo_cargo.rango if tipo_cargo else None,
                'dedicacion': tipo_cargo.dedicacion if tipo_cargo else None,
                'horas_semanales': (tipo_cargo.horas_semanales or 0) if tipo_cargo else 0,
                'puntaje': float(tipo_cargo.puntaje) if tipo_cargo and tipo_cargo.puntaje else None,
                'estado': estado,
                'fecha_vencimiento': fecha_venc,
                'fuente_vencimiento': fuente,
                'vencimiento_estimado': estimado,
                'vencido': bool(fecha_venc and fecha_venc < hoy and estado == 'vigente'),
                'dias_para_vencer': (fecha_venc - hoy).days if fecha_venc else None,
                'fecha_alta': primera.fecha_desde if primera else None,
                'fecha_ultima_renovacion': ultima.fecha_desde if ultima else None,
                'tipo_ultima_designacion': ultima.tipo if ultima else None,
                'tipo_ultima_designacion_display': ultima.get_tipo_display() if ultima else None,
                'anios_en_cargo': _anios_entre(primera.fecha_desde if primera else None, hoy),
                'anios_desde_ultima_renovacion': _anios_entre(
                    ultima.fecha_desde if ultima else None, hoy),
                'cantidad_designaciones': len(eventos),
                'tiene_prorroga_70': pror70 is not None,
                'rol_gestion': rol_gestion,
                'en_tramite': any(d.en_tramite for d in eventos),
                'renovacion_en_tramite': {
                    'id': renovacion_en_tramite.id,
                    'tipo': renovacion_en_tramite.get_tipo_display(),
                    'fecha_desde': renovacion_en_tramite.fecha_desde,
                    'expediente': renovacion_en_tramite.expediente,
                } if renovacion_en_tramite else None,
                'renuncia_definitiva': bool(cierre and cierre.renuncia_definitiva),
                'motivo_cierre': cierre.get_tipo_display() if cierre else None,
                'fecha_cierre': cierre.fecha_desde if cierre else None,
                'licencia_tipo': licencia_vigente.get_tipo_display() if licencia_vigente else None,
                'areas': areas,
                'asignaturas': asignaturas,
            })

    ocupaciones.sort(key=lambda o: (o['docente'], o['codigo_cargo']))
    return ocupaciones


# ---------------------------------------------------------------------------
# vista
# ---------------------------------------------------------------------------

class ReportePlantaView(APIView):
    """Informe consolidado de planta docente.

    GET /facet/reporte-planta/

    Parámetros:
      - departamento: id (opcional) — acota a un departamento
      - edad_critica: int (default 65) — umbral de riesgo jubilatorio
      - cobertura_minima: int (default 1) — docentes mínimos por asignatura
      - horizonte_dias: int (default 365) — ventana de vencimientos próximos
    """

    permission_classes = [AllowAny]

    def get(self, request):
        hoy = date.today()
        depto_id = request.query_params.get('departamento')
        edad_critica = _int_param(request, 'edad_critica', 65, 40, 90)
        cobertura_minima = _int_param(request, 'cobertura_minima', 1, 1, 10)
        horizonte = _int_param(request, 'horizonte_dias', 365, 30, 3650)

        # ---- datos base ---------------------------------------------------
        # El filtro por departamento se aplica sobre los DOCENTES, no sobre las
        # designaciones: una renuncia o una prórroga por cargo de gestión no
        # tienen área ni asignatura, y filtrarlas directamente las dejaría
        # afuera, con lo que los cargos nunca se cerrarían ni se extenderían.
        docentes_qs = Docente.objects.filter(estado='1').select_related(
            'persona', 'persona__titulo')

        if depto_id:
            docentes_del_depto = set(
                Designacion.objects.filter(estado='1').filter(
                    Q(cargo_departamento__departamento_id=depto_id)
                    | Q(asignatura__departamento_id=depto_id)
                    | Q(area__departamento_id=depto_id)
                ).values_list('docente_id', flat=True)
            )
            docentes_del_depto |= set(
                AsignaturaDocente.objects.filter(
                    estado='1', asignatura__departamento_id=depto_id,
                ).values_list('docente_id', flat=True)
            )
            docentes_qs = docentes_qs.filter(id__in=docentes_del_depto)

        docentes = list(docentes_qs)
        docente_ids = [d.id for d in docentes]

        desigs_qs = Designacion.objects.filter(
            estado='1', docente_id__in=docente_ids,
        ).select_related(
            'docente__persona', 'tipo_cargo', 'asignatura', 'area',
            'cargo_departamento', 'resolucion',
        )
        designaciones = list(desigs_qs)

        docente_info = {}
        for d in docentes:
            p = d.persona
            docente_info[d.id] = {
                'id': d.id,
                'dni': p.dni,
                'cuil': p.cuil,
                'legajo': p.legajo,
                'nombre': p.nombre,
                'apellido': p.apellido,
                'nombre_completo': f'{p.apellido}, {p.nombre}',
                'email': p.email,
                'sexo': p.sexo,
                'titulo': p.titulo.nombre if p.titulo else None,
                'fecha_nacimiento': p.fecha_nacimiento,
                'edad': _edad_a(p.fecha_nacimiento, hoy),
                'fecha_ingreso': p.fecha_ingreso,
                'antiguedad': _edad_a(p.fecha_ingreso, hoy),
                'estado_agente': p.estado_agente,
                'acoop': p.acoop,
                'observaciones': p.observaciones,
            }

        licencias_qs = Licencia.objects.filter(
            estado='1', docente_id__in=docente_ids,
        ).select_related('docente__persona', 'reemplazante__persona')
        licencias_por_docente = defaultdict(list)
        for l in licencias_qs:
            licencias_por_docente[l.docente_id].append(l)

        desigs_por_docente = defaultdict(list)
        for d in designaciones:
            desigs_por_docente[d.docente_id].append(d)

        ocupaciones = _derivar_ocupaciones(
            desigs_por_docente, licencias_por_docente, docente_info, hoy)

        # ---- armado de tableros -------------------------------------------
        activos = {i for i, v in docente_info.items() if v['estado_agente'] == 'activo'}
        ocup_vigentes = [o for o in ocupaciones
                         if o['estado'] == 'vigente' and o['docente_id'] in activos]

        payload = {
            'generado': hoy,
            'parametros': {
                'departamento': int(depto_id) if depto_id else None,
                'edad_critica': edad_critica,
                'cobertura_minima': cobertura_minima,
                'horizonte_dias': horizonte,
            },
            'resumen': self._resumen(
                docente_info, ocupaciones, ocup_vigentes, designaciones,
                edad_critica, cobertura_minima, depto_id, hoy),
            'distribucion': self._distribucion(ocup_vigentes),
            'docentes': self._docentes(docente_info, ocupaciones, hoy, edad_critica),
            'ocupaciones': ocupaciones,
            'vencimientos': self._vencimientos(ocup_vigentes, horizonte, hoy),
            'jubilacion': self._jubilacion(docente_info, ocupaciones, edad_critica, hoy),
            'renovacion': self._renovacion(ocup_vigentes),
            'tramites': self._tramites(designaciones, ocupaciones, hoy),
            'cobertura': self._cobertura(ocupaciones, activos, cobertura_minima, depto_id),
            'cumpleanos': self._cumpleanos(docente_info),
            'designaciones_resumen': self._designaciones_resumen(designaciones),
            'seguimientos': self._seguimientos(docente_info),
            'dedicacion_por_area': self._dedicacion_por_area(ocup_vigentes),
            'alertas': [],
        }
        payload['alertas'] = self._alertas(payload)
        return Response(payload)

    # -- tableros ----------------------------------------------------------

    def _resumen(self, docente_info, ocupaciones, ocup_vigentes, designaciones,
                 edad_critica, cobertura_minima, depto_id, hoy):
        estados = Counter(v['estado_agente'] for v in docente_info.values())
        horas = sum(o['horas_semanales'] for o in ocup_vigentes)
        activos = estados.get('activo', 0)

        en_riesgo = sum(
            1 for v in docente_info.values()
            if v['edad'] is not None and v['edad'] >= edad_critica
            and v['estado_agente'] == 'activo')

        renuncias_def = sum(
            1 for d in designaciones
            if d.tipo == Designacion.RENUNCIA and d.renuncia_definitiva)

        asigs = Asignatura.objects.filter(estado='1')
        if depto_id:
            asigs = asigs.filter(departamento_id=depto_id)
        total_asignaturas = asigs.count()

        seguimientos_abiertos = Seguimiento.objects.filter(
            estado='1', estado_seguimiento__in=['pendiente', 'en_curso'],
            docente_id__in=list(docente_info.keys()),
        ).count()

        return {
            'docentes_activos': activos,
            'docentes_en_licencia': estados.get('licencia', 0),
            'docentes_jubilados': estados.get('jubilado', 0),
            'docentes_inactivos': estados.get('inactivo', 0) + estados.get('renuncia', 0),
            'total_docentes': len(docente_info),
            'renuncias_definitivas': renuncias_def,
            'cargos_vigentes': len(ocup_vigentes),
            'cargos_totales': len(ocupaciones),
            'cargos_en_licencia': sum(
                1 for o in ocupaciones if o['estado'] == 'licencia'),
            'cargos_cerrados': sum(
                1 for o in ocupaciones if o['estado'] == 'cerrada'),
            'cargos_vencidos': sum(1 for o in ocup_vigentes if o['vencido']),
            'cargos_sin_vencimiento': sum(
                1 for o in ocup_vigentes if o['fecha_vencimiento'] is None),
            'horas_semanales': horas,
            'horas_promedio_por_docente': round(horas / activos, 1) if activos else 0,
            'puntaje_total': round(sum(
                o['puntaje'] or 0 for o in ocup_vigentes), 2),
            'docentes_en_riesgo_edad': en_riesgo,
            'total_asignaturas': total_asignaturas,
            'seguimientos_abiertos': seguimientos_abiertos,
            'designaciones_en_tramite': sum(1 for d in designaciones if d.en_tramite),
        }

    def _distribucion(self, ocup_vigentes):
        """Tabla de doble entrada rango × dedicación, discriminando estado."""
        celdas = {r: {d: {'vigente': 0, 'vencido': 0, 'renuncia': 0}
                      for d in DEDICACIONES} for r in RANGOS}

        for o in ocup_vigentes:
            r, d = o['rango'], o['dedicacion']
            if r not in celdas or d not in celdas[r]:
                continue
            if o['renuncia_definitiva']:
                clave = 'renuncia'
            elif o['vencido']:
                clave = 'vencido'
            else:
                clave = 'vigente'
            celdas[r][d][clave] += 1

        def total_celda(c):
            return c['vigente'] + c['vencido'] + c['renuncia']

        return {
            'rangos': [{'clave': r, 'label': RANGO_LABEL[r]} for r in RANGOS],
            'dedicaciones': [{'clave': d, 'label': DEDICACION_LABEL[d]}
                             for d in DEDICACIONES],
            'celdas': celdas,
            'total_por_rango': {
                r: sum(total_celda(celdas[r][d]) for d in DEDICACIONES) for r in RANGOS},
            'total_por_dedicacion': {
                d: sum(total_celda(celdas[r][d]) for r in RANGOS) for d in DEDICACIONES},
            'total': sum(total_celda(celdas[r][d])
                         for r in RANGOS for d in DEDICACIONES),
        }

    def _docentes(self, docente_info, ocupaciones, hoy, edad_critica):
        por_docente = defaultdict(list)
        for o in ocupaciones:
            por_docente[o['docente_id']].append(o)

        filas = []
        for did, info in docente_info.items():
            ocups = por_docente.get(did, [])
            vigentes = [o for o in ocups if o['estado'] == 'vigente']
            areas = sorted({a for o in ocups for a in o['areas']})
            asigs = sorted({a for o in ocups for a in o['asignaturas']})
            filas.append({
                **info,
                'cargos_vigentes': len(vigentes),
                'cargos_totales': len(ocups),
                'horas_semanales': sum(o['horas_semanales'] for o in vigentes),
                'puntaje': round(sum(o['puntaje'] or 0 for o in vigentes), 2),
                'tiene_cargo_vencido': any(o['vencido'] for o in vigentes),
                'en_tramite': any(o['en_tramite'] for o in ocups),
                'en_riesgo_edad': info['edad'] is not None and info['edad'] >= edad_critica,
                'areas': areas,
                'asignaturas': asigs,
                'sin_cargo': not ocups,
            })
        filas.sort(key=lambda f: (f['apellido'], f['nombre']))
        return filas

    def _vencimientos(self, ocup_vigentes, horizonte, hoy):
        buckets = {
            'vencidos': [], 'vence_30': [], 'vence_90': [],
            'vence_180': [], 'vence_horizonte': [], 'sin_fecha': [],
        }
        for o in ocup_vigentes:
            dias = o['dias_para_vencer']
            if dias is None:
                buckets['sin_fecha'].append(o)
            elif dias < 0:
                buckets['vencidos'].append(o)
            elif dias <= 30:
                buckets['vence_30'].append(o)
            elif dias <= 90:
                buckets['vence_90'].append(o)
            elif dias <= 180:
                buckets['vence_180'].append(o)
            elif dias <= horizonte:
                buckets['vence_horizonte'].append(o)

        for k in buckets:
            buckets[k].sort(key=lambda o: (o['fecha_vencimiento'] or date.max))

        # Vencimientos por mes, para la línea de tiempo.
        por_mes = Counter()
        for o in ocup_vigentes:
            f = o['fecha_vencimiento']
            if f and hoy <= f <= hoy + timedelta(days=horizonte):
                por_mes[f.strftime('%Y-%m')] += 1

        return {
            'buckets': buckets,
            'conteos': {k: len(v) for k, v in buckets.items()},
            'estimados': sum(1 for o in ocup_vigentes if o['vencimiento_estimado']),
            'por_mes': [{'mes': m, 'cantidad': c} for m, c in sorted(por_mes.items())],
        }

    def _jubilacion(self, docente_info, ocupaciones, edad_critica, hoy):
        horas_por_docente = defaultdict(int)
        for o in ocupaciones:
            if o['estado'] == 'vigente':
                horas_por_docente[o['docente_id']] += o['horas_semanales']

        filas = []
        for did, info in docente_info.items():
            if info['estado_agente'] != 'activo' or info['edad'] is None:
                continue
            f70 = _sumar_anios(info['fecha_nacimiento'], EDAD_JUBILATORIA)
            fcrit = _sumar_anios(info['fecha_nacimiento'], edad_critica)
            filas.append({
                'docente_id': did,
                'docente': info['nombre_completo'],
                'dni': info['dni'],
                'edad': info['edad'],
                'antiguedad': info['antiguedad'],
                'fecha_nacimiento': info['fecha_nacimiento'],
                'cumple_70': f70,
                'cumple_edad_critica': fcrit,
                'dias_para_70': (f70 - hoy).days if f70 else None,
                'horas_semanales': horas_por_docente.get(did, 0),
                'cargos': [o['denominacion'] for o in ocupaciones
                           if o['docente_id'] == did and o['estado'] == 'vigente'],
            })
        filas.sort(key=lambda f: -(f['edad'] or 0))

        def rango(f):
            e = f['edad']
            if e >= EDAD_JUBILATORIA:
                return 'supera_70'
            if e >= edad_critica:
                return 'critico'
            if e >= edad_critica - 5:
                return 'proximo'
            return 'sin_riesgo'

        grupos = defaultdict(list)
        for f in filas:
            grupos[rango(f)].append(f)

        # Impacto en horas si se jubilan los que superan el umbral.
        horas_en_riesgo = sum(
            f['horas_semanales'] for f in grupos['supera_70'] + grupos['critico'])

        # Pirámide etaria por quinquenio.
        piramide = Counter()
        for f in filas:
            base = (f['edad'] // 5) * 5
            piramide[f'{base}-{base + 4}'] += 1

        return {
            'grupos': dict(grupos),
            'conteos': {k: len(v) for k, v in grupos.items()},
            'horas_en_riesgo': horas_en_riesgo,
            'edad_promedio': round(
                sum(f['edad'] for f in filas) / len(filas), 1) if filas else None,
            'piramide': [{'rango': k, 'cantidad': v}
                         for k, v in sorted(piramide.items())],
        }

    def _renovacion(self, ocup_vigentes):
        buckets = defaultdict(list)
        for o in ocup_vigentes:
            a = o['anios_desde_ultima_renovacion']
            if a is None:
                buckets['sin_fecha'].append(o)
            elif a >= 5:
                buckets['mas_5'].append(o)
            elif a >= 3:
                buckets['de_3_a_5'].append(o)
            elif a >= 1:
                buckets['de_1_a_3'].append(o)
            else:
                buckets['menos_1'].append(o)

        for k in buckets:
            buckets[k].sort(
                key=lambda o: -(o['anios_desde_ultima_renovacion'] or 0))

        con_fecha = [o for o in ocup_vigentes
                     if o['anios_desde_ultima_renovacion'] is not None]
        return {
            'buckets': dict(buckets),
            'conteos': {k: len(v) for k, v in buckets.items()},
            'promedio_anios': round(
                sum(o['anios_desde_ultima_renovacion'] for o in con_fecha) / len(con_fecha), 2
            ) if con_fecha else None,
        }

    def _tramites(self, designaciones, ocupaciones, hoy):
        en_tramite = [d for d in designaciones if d.en_tramite]
        sin_instrumento = [
            d for d in designaciones
            if not d.resolucion_id and not d.nro_resolucion and not d.expediente
        ]
        sin_dgpres = [
            d for d in designaciones
            if d.tipo in (Designacion.DI_GENUINO, Designacion.DI_NO_GENUINO,
                          Designacion.CON, Designacion.CON_INTERINO)
            and not d.dgpres
        ]

        def fila(d):
            return {
                'id': d.id,
                'docente': f'{d.docente.persona.apellido}, {d.docente.persona.nombre}',
                'docente_id': d.docente_id,
                'tipo': d.tipo,
                'tipo_display': d.get_tipo_display(),
                'codigo_cargo': d.codigo_cargo,
                'denominacion': d.tipo_cargo.denominacion if d.tipo_cargo else None,
                'expediente': d.expediente,
                'nro_resolucion': d.nro_resolucion or (
                    d.resolucion.nresolucion if d.resolucion else None),
                'dgpres': d.dgpres,
                'fecha_desde': d.fecha_desde,
                'fecha_hasta': d.fecha_hasta,
                'dias_en_tramite': (hoy - d.fecha_desde).days if d.fecha_desde else None,
                'observaciones': d.observaciones,
            }

        return {
            'en_tramite': [fila(d) for d in sorted(
                en_tramite, key=lambda d: d.fecha_desde or date.min)],
            'sin_instrumento': [fila(d) for d in sin_instrumento],
            'sin_dgpres': [fila(d) for d in sin_dgpres],
            'conteos': {
                'en_tramite': len(en_tramite),
                'sin_instrumento': len(sin_instrumento),
                'sin_dgpres': len(sin_dgpres),
            },
        }

    def _cobertura(self, ocupaciones, activos, cobertura_minima, depto_id):
        """Docentes activos por asignatura, cruzado con la matrícula."""
        asigs = Asignatura.objects.filter(estado='1').select_related('area')
        if depto_id:
            asigs = asigs.filter(departamento_id=depto_id)
        asigs = list(asigs)
        asig_por_nombre = {a.nombre: a for a in asigs}

        docentes_por_asig = defaultdict(set)
        for o in ocupaciones:
            if o['estado'] != 'vigente' or o['docente_id'] not in activos:
                continue
            for nombre in o['asignaturas']:
                docentes_por_asig[nombre].add(o['docente_id'])

        # La relación AsignaturaDocente sigue siendo válida como fuente extra.
        ad_qs = AsignaturaDocente.objects.filter(estado='1').select_related(
            'asignatura', 'docente')
        if depto_id:
            ad_qs = ad_qs.filter(asignatura__departamento_id=depto_id)
        for ad in ad_qs:
            if ad.docente_id in activos:
                docentes_por_asig[ad.asignatura.nombre].add(ad.docente_id)

        # Matrícula del último año cargado, por asignatura.
        est_qs = EstadisticaAsignatura.objects.filter(estado='1')
        if depto_id:
            est_qs = est_qs.filter(asignatura__departamento_id=depto_id)
        matricula = defaultdict(lambda: {'anio': None, 'inscriptos': 0})
        for e in est_qs:
            actual = matricula[e.asignatura_id]
            if actual['anio'] is None or e.anio > actual['anio']:
                matricula[e.asignatura_id] = {'anio': e.anio, 'inscriptos': e.inscriptos}
            elif e.anio == actual['anio']:
                actual['inscriptos'] += e.inscriptos

        filas = []
        for a in asigs:
            n = len(docentes_por_asig.get(a.nombre, ()))
            m = matricula.get(a.id, {'anio': None, 'inscriptos': 0})
            filas.append({
                'asignatura_id': a.id,
                'asignatura': a.nombre,
                'codigo': a.codigo,
                'codigo_siu': a.codigo_siu,
                'conciliada_siu': a.conciliada_siu,
                'area': a.area.nombre if a.area else None,
                'docentes': n,
                'critica': n <= cobertura_minima,
                'sin_cobertura': n == 0,
                'inscriptos': m['inscriptos'],
                'anio_matricula': m['anio'],
                'inscriptos_por_docente': round(m['inscriptos'] / n, 1) if n else None,
            })
        filas.sort(key=lambda f: (f['docentes'], -f['inscriptos']))

        return {
            'asignaturas': filas,
            'conteos': {
                'total': len(filas),
                'criticas': sum(1 for f in filas if f['critica']),
                'sin_cobertura': sum(1 for f in filas if f['sin_cobertura']),
                'sin_codigo_siu': sum(1 for f in filas if not f['codigo_siu']),
            },
        }

    def _cumpleanos(self, docente_info):
        MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio',
                 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
        por_mes = defaultdict(list)
        for info in docente_info.values():
            fn = info['fecha_nacimiento']
            if not fn or info['estado_agente'] != 'activo':
                continue
            por_mes[fn.month].append({
                'docente': info['nombre_completo'],
                'dia': fn.day,
                'mes': fn.month,
                'edad': info['edad'],
                'email': info['email'],
            })
        for m in por_mes:
            por_mes[m].sort(key=lambda x: x['dia'])
        return [{'mes': i, 'nombre': MESES[i - 1], 'docentes': por_mes.get(i, [])}
                for i in range(1, 13)]

    def _designaciones_resumen(self, designaciones):
        por_tipo = Counter(d.get_tipo_display() for d in designaciones)
        por_anio = Counter(
            d.fecha_desde.year for d in designaciones if d.fecha_desde)
        por_instrumento = Counter(
            d.get_tipo_instrumento_display() if d.tipo_instrumento else 'Sin instrumento'
            for d in designaciones)
        return {
            'total': len(designaciones),
            'por_tipo': [{'tipo': k, 'cantidad': v}
                         for k, v in por_tipo.most_common()],
            'por_anio': [{'anio': k, 'cantidad': v}
                         for k, v in sorted(por_anio.items())],
            'por_instrumento': [{'instrumento': k, 'cantidad': v}
                                for k, v in por_instrumento.most_common()],
        }

    def _seguimientos(self, docente_info):
        qs = Seguimiento.objects.filter(
            estado='1', docente_id__in=list(docente_info.keys()),
        ).select_related('docente__persona').order_by(
            'estado_seguimiento', '-fecha_novedad')

        filas = [{
            'id': s.id,
            'docente_id': s.docente_id,
            'docente': f'{s.docente.persona.apellido}, {s.docente.persona.nombre}',
            'tipo': s.tipo,
            'tipo_display': s.get_tipo_display(),
            'descripcion': s.descripcion,
            'fecha_novedad': s.fecha_novedad,
            'fecha_resolucion': s.fecha_resolucion,
            'responsable': s.responsable,
            'prioridad': s.prioridad,
            'estado_seguimiento': s.estado_seguimiento,
            'abierto': s.abierto,
        } for s in qs]

        abiertos = [f for f in filas if f['abierto']]
        return {
            'items': filas,
            'conteos': {
                'total': len(filas),
                'abiertos': len(abiertos),
                'alta_prioridad': sum(1 for f in abiertos if f['prioridad'] == 'alta'),
            },
            'por_tipo': [{'tipo': k, 'cantidad': v} for k, v in
                         Counter(f['tipo_display'] for f in abiertos).most_common()],
            'por_responsable': [{'responsable': k or 'Sin asignar', 'cantidad': v}
                                for k, v in Counter(
                                    f['responsable'] for f in abiertos).most_common()],
        }

    def _dedicacion_por_area(self, ocup_vigentes):
        acum = defaultdict(lambda: {
            'horas': 0, 'cargos': 0, 'puntaje': 0.0,
            'docentes': set(), 'por_rango': Counter(),
        })
        for o in ocup_vigentes:
            areas = o['areas'] or ['(sin área asignada)']
            for a in areas:
                r = acum[a]
                r['horas'] += o['horas_semanales']
                r['cargos'] += 1
                r['puntaje'] += o['puntaje'] or 0
                r['docentes'].add(o['docente_id'])
                if o['rango']:
                    r['por_rango'][o['rango']] += 1

        filas = [{
            'area': a,
            'horas': v['horas'],
            'cargos': v['cargos'],
            'puntaje': round(v['puntaje'], 2),
            'docentes': len(v['docentes']),
            'por_rango': dict(v['por_rango']),
        } for a, v in acum.items()]
        filas.sort(key=lambda f: -f['horas'])

        # Áreas sin nombre normalizado que podrían ser la misma.
        nombres = [f['area'] for f in filas]
        sospechosas = []
        for i, a in enumerate(nombres):
            for b in nombres[i + 1:]:
                na, nb = a.upper().strip(), b.upper().strip()
                if na != nb and (na.startswith(nb) or nb.startswith(na)):
                    sospechosas.append({'a': a, 'b': b})

        # Áreas dadas de alta sin ningún cargo vigente asociado.
        con_cargo = {f['area'] for f in filas}
        huerfanas = [
            a.nombre for a in Area.objects.filter(estado='1')
            if a.nombre not in con_cargo
        ]

        return {
            'areas': filas,
            'posibles_duplicados': sospechosas,
            'areas_sin_cargos': huerfanas,
        }

    def _alertas(self, payload):
        """Lista corta y accionable de lo que requiere atención."""
        a = []
        r = payload['resumen']

        if r['cargos_vencidos']:
            a.append({
                'nivel': 'critico',
                'titulo': f"{r['cargos_vencidos']} cargos vigentes están vencidos",
                'detalle': 'Requieren renovación o nueva designación.',
                'tablero': 'vencimientos',
            })
        vence_30 = payload['vencimientos']['conteos']['vence_30']
        if vence_30:
            a.append({
                'nivel': 'alto',
                'titulo': f'{vence_30} cargos vencen en los próximos 30 días',
                'detalle': 'Iniciar el trámite de renovación.',
                'tablero': 'vencimientos',
            })
        supera_70 = payload['jubilacion']['conteos'].get('supera_70', 0)
        if supera_70:
            a.append({
                'nivel': 'critico',
                'titulo': f'{supera_70} docentes superan los {EDAD_JUBILATORIA} años',
                'detalle': f"Impacto: {payload['jubilacion']['horas_en_riesgo']} horas semanales en riesgo.",
                'tablero': 'jubilacion',
            })
        sin_cob = payload['cobertura']['conteos']['sin_cobertura']
        if sin_cob:
            a.append({
                'nivel': 'critico',
                'titulo': f'{sin_cob} asignaturas sin ningún docente activo',
                'detalle': 'No hay quien las dicte según los datos cargados.',
                'tablero': 'cobertura',
            })
        criticas = payload['cobertura']['conteos']['criticas']
        if criticas:
            a.append({
                'nivel': 'alto',
                'titulo': f'{criticas} asignaturas con cobertura crítica',
                'detalle': f"Con {payload['parametros']['cobertura_minima']} docente o menos.",
                'tablero': 'cobertura',
            })
        if r['designaciones_en_tramite']:
            a.append({
                'nivel': 'medio',
                'titulo': f"{r['designaciones_en_tramite']} designaciones en trámite",
                'detalle': 'Sin instrumento firme.',
                'tablero': 'tramites',
            })
        sin_instr = payload['tramites']['conteos']['sin_instrumento']
        if sin_instr:
            a.append({
                'nivel': 'medio',
                'titulo': f'{sin_instr} designaciones sin expediente ni resolución',
                'detalle': 'No hay respaldo documental cargado.',
                'tablero': 'tramites',
            })
        alta = payload['seguimientos']['conteos']['alta_prioridad']
        if alta:
            a.append({
                'nivel': 'alto',
                'titulo': f'{alta} seguimientos de prioridad alta sin resolver',
                'detalle': 'Novedades del departamento pendientes.',
                'tablero': 'seguimientos',
            })
        sin_siu = payload['cobertura']['conteos']['sin_codigo_siu']
        if sin_siu:
            a.append({
                'nivel': 'bajo',
                'titulo': f'{sin_siu} asignaturas sin código SIU Guaraní',
                'detalle': 'No se pueden cruzar con el sistema académico.',
                'tablero': 'cobertura',
            })
        dups = payload['dedicacion_por_area']['posibles_duplicados']
        if dups:
            a.append({
                'nivel': 'bajo',
                'titulo': f'{len(dups)} pares de áreas con nombres casi idénticos',
                'detalle': 'Probables duplicados a unificar.',
                'tablero': 'areas',
            })

        orden = {'critico': 0, 'alto': 1, 'medio': 2, 'bajo': 3}
        a.sort(key=lambda x: orden[x['nivel']])
        return a
