"""
Carga / actualización de TipoCargo, Cargo y CargoHistorial desde los
Excel oficiales.

Idempotente: re-ejecutable sin duplicar datos.
- TipoCargo se upsertea por (descripcion, dedicacion) — unique constraint.
- Cargo se upsertea por numero_de_cargo (unique).
- CargoHistorial se inserta una vez por cargo (si ya existe, se omite).

Uso:
    python cargarCargos.py [--dry-run] [--solo-tipos]

Configuración de DB:
    Por defecto usa la DB local (admin@localhost). Para apuntar a otra
    base (ej. producción), exportar antes:

        export DB_NAME=... DB_USER=... DB_PASSWORD=... DB_HOST=... DB_PORT=5432

Archivos requeridos en este mismo directorio (o pasar rutas absolutas
via env TABLA_CARGOS_XLSX y CARGOS_XLS):
    - "Tabla de Cargos Docentes.xlsx"  (catálogo de puntajes)
    - "e_13_04_2026.xls"               (cargos reales, exportado del sistema)

NOTA: para producción usar cargarCargos_embedded.py (datos inline,
no requiere pandas ni archivos Excel).
"""

import argparse
import os
import sys
from datetime import datetime, date
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

# Dedicaciones válidas según el modelo.
DEDICACIONES_VALIDAS = {"SIMP", "SEMI", "EXCL", "35HS"}

# Caracteres del Excel → tipo de ocupante.
CARACTERES_DOCENTE = {"D-OR", "D-IN", "DAUX", "D-NM"}
CARACTERES_NO_DOCENTE = {"ND-P", "S-02"}


def cargar_tipos_con_puntaje(cur, path, dry_run, now):
    df = pd.read_excel(path)
    df.columns = ["Cargo", "Descripcion", "Simple", "Part-Time", "Full-Time"]

    creados = actualizados = sin_cambios = 0

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
                        "INSERT INTO departamentos_tipocargo "
                        "(sigla,descripcion,dedicacion,puntaje,estado,fecha_creacion,fecha_modificacion) "
                        "VALUES (%s,%s,%s,%s,%s,%s,%s)",
                        (sigla, descripcion_source, dedicacion, puntaje, "1", now, now),
                    )
                creados += 1
            else:
                _id, sigla_old, puntaje_old = existente
                if sigla_old != sigla or puntaje_old != puntaje:
                    if not dry_run:
                        cur.execute(
                            "UPDATE departamentos_tipocargo "
                            "SET sigla=%s, puntaje=%s, fecha_modificacion=%s WHERE id=%s",
                            (sigla, puntaje, now, _id),
                        )
                    actualizados += 1
                else:
                    sin_cambios += 1

    return creados, actualizados, sin_cambios


def cargar_tipos_sin_puntaje(cur, df_cargos, dry_run, now):
    pares = df_cargos[["descrip", "dedicacion"]].dropna().drop_duplicates()
    creados = sin_cambios = 0

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
                "INSERT INTO departamentos_tipocargo "
                "(sigla,descripcion,dedicacion,puntaje,estado,fecha_creacion,fecha_modificacion) "
                "VALUES (%s,%s,%s,%s,%s,%s,%s)",
                ("", descripcion, dedicacion, None, "1", now, now),
            )
        creados += 1

    return creados, sin_cambios


def cargar_cargos(cur, df_cargos, dry_run, now):
    cur.execute("SELECT id, descripcion, dedicacion FROM departamentos_tipocargo")
    lookup_tipo = {(d, ded): _id for (_id, d, ded) in cur.fetchall()}

    creados = actualizados = sin_cambios = sin_tipo = 0

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

        cur.execute(
            "SELECT id, tipo_cargo_id FROM departamentos_cargo "
            "WHERE numero_de_cargo=%s", (nrocargo,))
        existente = cur.fetchone()

        if existente is None:
            if not dry_run:
                cur.execute(
                    "INSERT INTO departamentos_cargo "
                    "(numero_de_cargo,tipo_cargo_id,cargo_departamento_id,"
                    "resolucion_oficializacion_id,observaciones,estado,"
                    "fecha_creacion,fecha_modificacion) "
                    "VALUES (%s,%s,NULL,NULL,NULL,%s,%s,%s)",
                    (nrocargo, tipo_cargo_id, "1", now, now),
                )
            creados += 1
        else:
            _id, tipo_old = existente
            if tipo_old != tipo_cargo_id and tipo_cargo_id is not None:
                if not dry_run:
                    cur.execute(
                        "UPDATE departamentos_cargo "
                        "SET tipo_cargo_id=%s, fecha_modificacion=%s WHERE id=%s",
                        (tipo_cargo_id, now, _id),
                    )
                actualizados += 1
            else:
                sin_cambios += 1

    return creados, actualizados, sin_cambios, sin_tipo


def cargar_historial(cur, df_cargos, dry_run, now):
    cur.execute("SELECT id, legajo FROM departamentos_persona WHERE legajo IS NOT NULL")
    legajo_to_persona = {l: i for (i, l) in cur.fetchall()}

    cur.execute("SELECT id, persona_id FROM departamentos_docente WHERE estado IN ('1', 'true')")
    persona_to_docente = {p: i for (i, p) in cur.fetchall()}

    cur.execute("SELECT id, persona_id FROM departamentos_nodocente WHERE estado IN ('1', 'true')")
    persona_to_nodocente = {p: i for (i, p) in cur.fetchall()}

    cur.execute("SELECT id, numero_de_cargo FROM departamentos_cargo")
    nrocargo_to_cargo = {n: i for (i, n) in cur.fetchall()}

    cur.execute("SELECT cargo_id FROM departamentos_cargohistorial")
    cargos_con_historial = {r[0] for r in cur.fetchall()}

    hoy = date.today()
    creados = ya_existe = sin_persona = sin_ocupante = sin_cargo = 0

    for _, row in df_cargos.iterrows():
        nrocargo = row.get("nrocargo")
        if pd.isnull(nrocargo):
            continue
        nrocargo = int(nrocargo)

        cargo_id = nrocargo_to_cargo.get(nrocargo)
        if cargo_id is None:
            sin_cargo += 1
            continue
        if cargo_id in cargos_con_historial:
            ya_existe += 1
            continue

        legajo = str(int(row["nrolegajo"])) if pd.notnull(row["nrolegajo"]) else None
        persona_id = legajo_to_persona.get(legajo) if legajo else None
        if persona_id is None:
            sin_persona += 1
            continue

        caracter = str(row["caracter"]).strip().upper() if pd.notnull(row["caracter"]) else None
        docente_id = no_docente_id = None
        if caracter in CARACTERES_DOCENTE:
            docente_id = persona_to_docente.get(persona_id)
        elif caracter in CARACTERES_NO_DOCENTE:
            no_docente_id = persona_to_nodocente.get(persona_id)

        if docente_id is None and no_docente_id is None:
            sin_ocupante += 1
            continue

        fa = row.get("fechaalta")
        fb = row.get("fechabaja")
        fecha_inicio = pd.to_datetime(fa).date() if pd.notnull(fa) else None
        fecha_fin = pd.to_datetime(fb).date() if pd.notnull(fb) else None
        if fecha_inicio is None:
            sin_ocupante += 1
            continue

        motivo_fin = "vencimiento" if (fecha_fin and fecha_fin < hoy) else None

        if not dry_run:
            cur.execute(
                "INSERT INTO departamentos_cargohistorial "
                "(cargo_id, docente_id, no_docente_id, fecha_inicio, fecha_fin, "
                " motivo_fin, observaciones, estado, fecha_creacion, fecha_modificacion) "
                "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                (cargo_id, docente_id, no_docente_id, fecha_inicio, fecha_fin,
                 motivo_fin, "Importado desde Excel.", "1", now, now),
            )
        creados += 1

    return creados, ya_existe, sin_persona, sin_ocupante, sin_cargo


def main():
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--solo-tipos", action="store_true")
    args = parser.parse_args()

    print(f"DB: {DB_CONFIG['user']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['dbname']}")
    print(f"Tabla equivalencias: {DEFAULT_TABLA_EQUIVALENCIA}")
    print(f"Cargos: {DEFAULT_CARGOS}")
    if args.dry_run:
        print(">>> DRY-RUN: no se hará COMMIT <<<")
    print()

    if DEFAULT_CARGOS.lower().endswith(".xls"):
        df_cargos = pd.read_html(DEFAULT_CARGOS)[0]
    else:
        df_cargos = pd.read_excel(DEFAULT_CARGOS)

    conn = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        now = datetime.now()

        print("[1/4] TipoCargo con puntaje (tabla de equivalencias)...")
        c, u, s = cargar_tipos_con_puntaje(cur, DEFAULT_TABLA_EQUIVALENCIA, args.dry_run, now)
        print(f"     creados={c}  actualizados={u}  sin_cambios={s}")

        print("[2/4] TipoCargo sin puntaje (descripciones del sistema)...")
        c, s = cargar_tipos_sin_puntaje(cur, df_cargos, args.dry_run, now)
        print(f"     creados={c}  sin_cambios={s}")

        if args.solo_tipos:
            print("--solo-tipos: omitiendo Cargo y CargoHistorial.")
        else:
            print(f"[3/4] Cargo (total {len(df_cargos)})...")
            c, u, s, sin_tipo = cargar_cargos(cur, df_cargos, args.dry_run, now)
            print(f"     creados={c}  actualizados={u}  sin_cambios={s}  sin_tipo={sin_tipo}")

            print(f"[4/4] CargoHistorial...")
            c, ye, sp, so, sc = cargar_historial(cur, df_cargos, args.dry_run, now)
            print(f"     creados={c}  ya_existe={ye}  sin_persona={sp}  sin_ocupante={so}  sin_cargo={sc}")

        if args.dry_run:
            conn.rollback()
            print("\nDRY-RUN: rollback ejecutado.")
        else:
            conn.commit()
            print("\nCOMMIT realizado.")

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
