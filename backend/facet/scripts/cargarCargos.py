"""
Carga / actualización de TipoCargo y Cargo desde los Excel oficiales.

Idempotente: re-ejecutable sin duplicar datos.
- TipoCargo se upsertea por (descripcion, dedicacion) — unique constraint.
- Cargo se upsertea por numero_de_cargo (unique).

Uso:
    python cargarCargos.py [--dry-run] [--solo-tipos]

Configuración de DB:
    Por defecto usa la DB local (admin@localhost). Para apuntar a otra
    base (ej. producción dentro del contenedor backend de Coolify),
    exportar antes:

        export DB_NAME=... DB_USER=... DB_PASSWORD=... DB_HOST=... DB_PORT=5432

Archivos requeridos en este mismo directorio (o pasar rutas absolutas
via env TABLA_CARGOS_XLSX y CARGOS_XLS):
    - "Tabla de Cargos Docentes.xlsx"  (catálogo de puntajes)
    - "e_13_04_2026.xls"               (cargos reales, exportado del sistema)
"""

import argparse
import os
import sys
from datetime import datetime
from decimal import Decimal

import pandas as pd
import psycopg2

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

DEFAULT_TABLA_EQUIVALENCIA = os.environ.get(
    "TABLA_CARGOS_XLSX",
    os.path.join(SCRIPT_DIR, "Tabla de Cargos Docentes.xlsx"),
)
DEFAULT_CARGOS = os.environ.get(
    "CARGOS_XLS",
    os.path.join(SCRIPT_DIR, "e_13_04_2026.xls"),
)

DB_CONFIG = {
    "dbname":   os.environ.get("DB_NAME",     "administracion-departamentos"),
    "user":     os.environ.get("DB_USER",     "admin"),
    "password": os.environ.get("DB_PASSWORD", "1234"),
    "host":     os.environ.get("DB_HOST",     "localhost"),
    "port":     os.environ.get("DB_PORT",     "5432"),
}

# Mapea las descripciones "amigables" del Excel de equivalencias a las
# descripciones reales que vienen en el sistema de origen (uppercase,
# tal como llegan en e_13_04_2026.xls).
DESCRIPCION_FRIENDLY_TO_SOURCE = {
    "Auxiliar Docente Graduado":  "AUX DOC DE PRIMERA",
    "Jefe de Trabajos Practicos": "JEFE TRABAJOS PRACT.",
    "Profesor Adjunto":           "PROFESOR ADJUNTO",
    "Profesor Asociado":          "PROFESOR ASOCIADO",
    "Profesor Titular":           "PROFESOR TITULAR",
}

# Columnas del Excel de equivalencias → códigos de dedicación del modelo.
COLUMNA_A_DEDICACION = {
    "Simple":    "SIMP",
    "Part-Time": "SEMI",
    "Full-Time": "EXCL",
}

# Dedicaciones válidas según el modelo (DEDICACION_CHOICES).
DEDICACIONES_VALIDAS = {"SIMP", "SEMI", "EXCL", "35HS"}


def cargar_tipos_con_puntaje(cur, path, dry_run):
    """Upsert de los TipoCargo que tienen sigla + puntaje (desde la
    tabla de equivalencias)."""
    df = pd.read_excel(path)
    # Pandas a veces no resuelve bien el encoding del header; renombrar
    # por posición para evitar depender del nombre con tilde.
    df.columns = ["Cargo", "Descripcion", "Simple", "Part-Time", "Full-Time"]

    creados = actualizados = sin_cambios = 0
    now = datetime.now()

    for _, row in df.iterrows():
        sigla = str(row["Cargo"]).strip()
        descripcion_friendly = str(row["Descripcion"]).strip()
        descripcion_source = DESCRIPCION_FRIENDLY_TO_SOURCE.get(
            descripcion_friendly, descripcion_friendly.upper()
        )

        for col, dedicacion in COLUMNA_A_DEDICACION.items():
            puntaje = row[col]
            if pd.isnull(puntaje):
                continue
            puntaje = Decimal(str(puntaje)).quantize(Decimal("0.01"))

            cur.execute(
                "SELECT id, sigla, puntaje FROM departamentos_tipocargo "
                "WHERE descripcion=%s AND dedicacion=%s",
                (descripcion_source, dedicacion),
            )
            existente = cur.fetchone()

            if existente is None:
                if not dry_run:
                    cur.execute(
                        """
                        INSERT INTO departamentos_tipocargo
                            (sigla, descripcion, dedicacion, puntaje,
                             estado, fecha_creacion, fecha_modificacion)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        """,
                        (sigla, descripcion_source, dedicacion, puntaje,
                         "1", now, now),
                    )
                creados += 1
                print(f"  + TipoCargo {sigla} {descripcion_source} {dedicacion} = {puntaje}")
            else:
                _id, sigla_old, puntaje_old = existente
                if sigla_old != sigla or puntaje_old != puntaje:
                    if not dry_run:
                        cur.execute(
                            """
                            UPDATE departamentos_tipocargo
                            SET sigla=%s, puntaje=%s, fecha_modificacion=%s
                            WHERE id=%s
                            """,
                            (sigla, puntaje, now, _id),
                        )
                    actualizados += 1
                    print(f"  ~ TipoCargo {descripcion_source} {dedicacion}: "
                          f"sigla {sigla_old!r}->{sigla!r}, "
                          f"puntaje {puntaje_old}->{puntaje}")
                else:
                    sin_cambios += 1

    return creados, actualizados, sin_cambios


def cargar_tipos_sin_puntaje(cur, df_cargos, dry_run):
    """Para cada (descrip, dedicacion) presente en el Excel de cargos
    que no exista todavía como TipoCargo, crearlo con puntaje=NULL.
    Cubre AUX DOCENTE SEGUNDA, DECANO FACULTAD, Categoria XX Dto.366,
    etc., que el modelo permite explícitamente."""
    pares = (
        df_cargos[["descrip", "dedicacion"]]
        .dropna()
        .drop_duplicates()
    )
    creados = sin_cambios = 0
    now = datetime.now()

    for _, row in pares.iterrows():
        descripcion = str(row["descrip"]).strip()
        dedicacion = str(row["dedicacion"]).strip().upper()
        if dedicacion not in DEDICACIONES_VALIDAS:
            print(f"  ! Dedicación desconocida ignorada: {dedicacion!r}")
            continue

        cur.execute(
            "SELECT id FROM departamentos_tipocargo "
            "WHERE descripcion=%s AND dedicacion=%s",
            (descripcion, dedicacion),
        )
        if cur.fetchone() is not None:
            sin_cambios += 1
            continue

        if not dry_run:
            cur.execute(
                """
                INSERT INTO departamentos_tipocargo
                    (sigla, descripcion, dedicacion, puntaje,
                     estado, fecha_creacion, fecha_modificacion)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                ("", descripcion, dedicacion, None, "1", now, now),
            )
        creados += 1
        print(f"  + TipoCargo (sin puntaje) {descripcion} {dedicacion}")

    return creados, sin_cambios


def cargar_cargos(cur, df_cargos, dry_run):
    """Upsert de Cargo por numero_de_cargo."""

    # Pre-cargar lookup (descripcion, dedicacion) -> tipo_cargo_id.
    cur.execute(
        "SELECT id, descripcion, dedicacion FROM departamentos_tipocargo"
    )
    lookup_tipo = {(d, ded): _id for (_id, d, ded) in cur.fetchall()}

    creados = actualizados = sin_cambios = sin_tipo = 0
    now = datetime.now()

    for _, row in df_cargos.iterrows():
        nrocargo = row.get("nrocargo")
        if pd.isnull(nrocargo):
            continue
        nrocargo = int(nrocargo)
        descripcion = str(row["descrip"]).strip() if pd.notnull(row["descrip"]) else None
        dedicacion = str(row["dedicacion"]).strip().upper() if pd.notnull(row["dedicacion"]) else None

        tipo_cargo_id = lookup_tipo.get((descripcion, dedicacion))
        if tipo_cargo_id is None:
            sin_tipo += 1
            print(f"  ! Cargo {nrocargo} sin TipoCargo ({descripcion!r}, {dedicacion!r}) — se inserta con tipo NULL")

        cur.execute(
            "SELECT id, tipo_cargo_id FROM departamentos_cargo "
            "WHERE numero_de_cargo=%s",
            (nrocargo,),
        )
        existente = cur.fetchone()

        if existente is None:
            if not dry_run:
                cur.execute(
                    """
                    INSERT INTO departamentos_cargo
                        (numero_de_cargo, tipo_cargo_id, departamento_id,
                         asignatura_id, resolucion_oficializacion_id,
                         observaciones, estado,
                         fecha_creacion, fecha_modificacion)
                    VALUES (%s, %s, NULL, NULL, NULL, NULL, %s, %s, %s)
                    """,
                    (nrocargo, tipo_cargo_id, "1", now, now),
                )
            creados += 1
        else:
            _id, tipo_old = existente
            if tipo_old != tipo_cargo_id and tipo_cargo_id is not None:
                if not dry_run:
                    cur.execute(
                        """
                        UPDATE departamentos_cargo
                        SET tipo_cargo_id=%s, fecha_modificacion=%s
                        WHERE id=%s
                        """,
                        (tipo_cargo_id, now, _id),
                    )
                actualizados += 1
                print(f"  ~ Cargo {nrocargo}: tipo_cargo_id {tipo_old}->{tipo_cargo_id}")
            else:
                sin_cambios += 1

    return creados, actualizados, sin_cambios, sin_tipo


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dry-run", action="store_true",
                        help="No hace COMMIT; solo reporta lo que cambiaría.")
    parser.add_argument("--solo-tipos", action="store_true",
                        help="Cargar únicamente TipoCargo, sin los Cargo individuales.")
    args = parser.parse_args()

    print(f"DB: {DB_CONFIG['user']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['dbname']}")
    print(f"Tabla equivalencias: {DEFAULT_TABLA_EQUIVALENCIA}")
    print(f"Cargos: {DEFAULT_CARGOS}")
    if args.dry_run:
        print(">>> DRY-RUN: no se hará COMMIT <<<")
    print()

    # El .xls del sistema es en realidad HTML; pd.read_html lo maneja.
    if DEFAULT_CARGOS.lower().endswith(".xls"):
        df_cargos = pd.read_html(DEFAULT_CARGOS)[0]
    else:
        df_cargos = pd.read_excel(DEFAULT_CARGOS)

    conn = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        print("[1/3] Cargando TipoCargo con puntaje (tabla de equivalencias)...")
        c1, u1, s1 = cargar_tipos_con_puntaje(cur, DEFAULT_TABLA_EQUIVALENCIA, args.dry_run)
        print(f"     creados={c1}  actualizados={u1}  sin_cambios={s1}\n")

        print("[2/3] Cargando TipoCargo sin puntaje (descripciones del sistema)...")
        c2, s2 = cargar_tipos_sin_puntaje(cur, df_cargos, args.dry_run)
        print(f"     creados={c2}  sin_cambios={s2}\n")

        if args.solo_tipos:
            print("--solo-tipos: omitiendo carga de Cargo.")
        else:
            print(f"[3/3] Cargando {len(df_cargos)} Cargo...")
            c3, u3, s3, sin_tipo = cargar_cargos(cur, df_cargos, args.dry_run)
            print(f"     creados={c3}  actualizados={u3}  sin_cambios={s3}  sin_tipo={sin_tipo}\n")

        if args.dry_run:
            conn.rollback()
            print("DRY-RUN: rollback ejecutado.")
        else:
            conn.commit()
            print("COMMIT realizado.")

    except Exception as e:
        if conn is not None:
            conn.rollback()
        print(f"ERROR: {e}", file=sys.stderr)
        raise
    finally:
        if conn is not None:
            cur.close()
            conn.close()


if __name__ == "__main__":
    main()
