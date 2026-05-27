"""Helper local: lee los Excel y genera cargarCargos_embedded.py con
todos los datos inline. Para uso en producción sin SSH/pandas.

Datos embebidos:
- TIPOS_CON_PUNTAJE: catálogo de equivalencias (sigla, descripcion, dedicacion, puntaje)
- TIPOS_SIN_PUNTAJE: descripciones del sistema sin puntaje (DECANO, Categoria Dto.366, etc.)
- CARGOS: (nrocargo, descripcion, dedicacion, legajo, caracter, fecha_inicio, fecha_fin)

El "legajo" sirve para matchear con Persona.legajo en prod. "caracter"
decide si el ocupante es Docente o NoDocente.
"""

import json
import os
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
PATH_EQ = os.path.join(HERE, "Tabla de Cargos Docentes.xlsx")
PATH_C = os.path.join(HERE, "e_13_04_2026.xls")
OUT = os.path.join(HERE, "cargarCargos_embedded.py")

DESC_MAP = {
    "Auxiliar Docente Graduado":  "AUX DOC DE PRIMERA",
    "Jefe de Trabajos Practicos": "JEFE TRABAJOS PRACT.",
    "Profesor Adjunto":           "PROFESOR ADJUNTO",
    "Profesor Asociado":          "PROFESOR ASOCIADO",
    "Profesor Titular":           "PROFESOR TITULAR",
}
DED_MAP = {"Simple": "SIMP", "Part-Time": "SEMI", "Full-Time": "EXCL"}


def parse_eq():
    df = pd.read_excel(PATH_EQ)
    df.columns = ["Cargo", "Descripcion", "Simple", "Part-Time", "Full-Time"]
    out = []
    for _, r in df.iterrows():
        sigla = str(r["Cargo"]).strip()
        desc = DESC_MAP[str(r["Descripcion"]).strip()]
        for col, ded in DED_MAP.items():
            p = r[col]
            if pd.isnull(p):
                continue
            out.append((sigla, desc, ded, float(p)))
    return out


def parse_cargos():
    df = pd.read_html(PATH_C)[0]
    cargos = []
    seen = set()
    for _, r in df.iterrows():
        nro = r.get("nrocargo")
        if pd.isnull(nro):
            continue
        nro = int(nro)
        if nro in seen:
            continue
        seen.add(nro)

        descrip = str(r["descrip"]).strip() if pd.notnull(r["descrip"]) else None
        ded = str(r["dedicacion"]).strip().upper() if pd.notnull(r["dedicacion"]) else None
        legajo = str(int(r["nrolegajo"])) if pd.notnull(r["nrolegajo"]) else None
        caracter = str(r["caracter"]).strip().upper() if pd.notnull(r["caracter"]) else None

        fa = r.get("fechaalta")
        fb = r.get("fechabaja")
        fa_iso = pd.to_datetime(fa).strftime("%Y-%m-%d") if pd.notnull(fa) else None
        fb_iso = pd.to_datetime(fb).strftime("%Y-%m-%d") if pd.notnull(fb) else None

        cargos.append((nro, descrip, ded, legajo, caracter, fa_iso, fb_iso))
    return cargos


def main():
    tipos_puntaje = parse_eq()
    cargos = parse_cargos()

    covered = {(d, ded) for _, d, ded, _ in tipos_puntaje}
    extras = sorted({
        (d, ded) for (_, d, ded, _, _, _, _) in cargos
        if d and ded and (d, ded) not in covered
    })

    template = TEMPLATE.format(
        tipos_puntaje=_fmt_list(tipos_puntaje),
        tipos_sin_puntaje=_fmt_list(extras),
        cargos=_fmt_list(cargos),
        n_cargos=len(cargos),
    )

    with open(OUT, "w", encoding="utf-8") as f:
        f.write(template)

    print(f"Generado: {OUT}")
    print(f"  TIPOS_CON_PUNTAJE: {len(tipos_puntaje)}")
    print(f"  TIPOS_SIN_PUNTAJE: {len(extras)}")
    print(f"  CARGOS: {len(cargos)}")


def _fmt_list(items):
    lines = []
    for it in items:
        lines.append("    " + repr(it) + ",")
    return "\n".join(lines)


TEMPLATE = '''\
"""
Carga de TipoCargo + Cargo + CargoHistorial en producción.

Script autocontenido, generado por _gen_embedded.py desde los Excel
oficiales. Solo depende de psycopg2 (ya viene con el backend Django).

Uso (dentro del contenedor backend):
    python scripts/cargarCargos_embedded.py [--dry-run] [--solo-tipos]

Pasos:
  [1/4] Upsert TipoCargo con puntaje (15 entradas del catálogo).
  [2/4] Upsert TipoCargo sin puntaje (descripciones del sistema).
  [3/4] Upsert Cargo por numero_de_cargo (FK a TipoCargo).
  [4/4] Insertar CargoHistorial: matchea legajo→Persona, decide
        Docente vs NoDocente según caracter, y crea el historial
        con fechaalta / fechabaja / motivo_fin.

Idempotente: re-ejecutarlo no duplica datos.

Requiere las env vars DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT
(ya están configuradas en el contenedor backend de Coolify).
"""

import argparse
import os
import sys
from datetime import datetime, date
from decimal import Decimal

import psycopg2

DB_CONFIG = {{
    "dbname":   os.environ["DB_NAME"],
    "user":     os.environ["DB_USER"],
    "password": os.environ["DB_PASSWORD"],
    "host":     os.environ["DB_HOST"],
    "port":     os.environ.get("DB_PORT", "5432"),
}}

# Caracteres docentes vs no-docentes en el Excel de origen.
CARACTERES_DOCENTE = {{"D-OR", "D-IN", "DAUX", "D-NM"}}
CARACTERES_NO_DOCENTE = {{"ND-P", "S-02"}}

# (sigla, descripcion, dedicacion, puntaje)
TIPOS_CON_PUNTAJE = [
{tipos_puntaje}
]

# (descripcion, dedicacion) — TipoCargo sin puntaje (catálogo)
TIPOS_SIN_PUNTAJE = [
{tipos_sin_puntaje}
]

# (numero_de_cargo, descripcion, dedicacion, legajo, caracter,
#  fecha_inicio, fecha_fin) — {n_cargos} cargos
CARGOS = [
{cargos}
]


def cargar_tipos_con_puntaje(cur, dry_run, now):
    creados = actualizados = sin_cambios = 0
    for sigla, desc, ded, puntaje in TIPOS_CON_PUNTAJE:
        puntaje = Decimal(str(puntaje)).quantize(Decimal("0.01"))
        cur.execute(
            "SELECT id, sigla, puntaje FROM departamentos_tipocargo "
            "WHERE descripcion=%s AND dedicacion=%s", (desc, ded))
        row = cur.fetchone()
        if row is None:
            if not dry_run:
                cur.execute(
                    "INSERT INTO departamentos_tipocargo "
                    "(sigla,descripcion,dedicacion,puntaje,estado,fecha_creacion,fecha_modificacion) "
                    "VALUES (%s,%s,%s,%s,%s,%s,%s)",
                    (sigla, desc, ded, puntaje, "1", now, now))
            creados += 1
        else:
            _id, sigla_old, puntaje_old = row
            if sigla_old != sigla or puntaje_old != puntaje:
                if not dry_run:
                    cur.execute(
                        "UPDATE departamentos_tipocargo "
                        "SET sigla=%s, puntaje=%s, fecha_modificacion=%s WHERE id=%s",
                        (sigla, puntaje, now, _id))
                actualizados += 1
            else:
                sin_cambios += 1
    return creados, actualizados, sin_cambios


def cargar_tipos_sin_puntaje(cur, dry_run, now):
    creados = sin_cambios = 0
    for desc, ded in TIPOS_SIN_PUNTAJE:
        cur.execute(
            "SELECT id FROM departamentos_tipocargo "
            "WHERE descripcion=%s AND dedicacion=%s", (desc, ded))
        if cur.fetchone():
            sin_cambios += 1
            continue
        if not dry_run:
            cur.execute(
                "INSERT INTO departamentos_tipocargo "
                "(sigla,descripcion,dedicacion,puntaje,estado,fecha_creacion,fecha_modificacion) "
                "VALUES (%s,%s,%s,%s,%s,%s,%s)",
                ("", desc, ded, None, "1", now, now))
        creados += 1
    return creados, sin_cambios


def cargar_cargos(cur, dry_run, now):
    cur.execute(
        "SELECT id, descripcion, dedicacion FROM departamentos_tipocargo")
    lookup_tipo = {{(d, ded): _id for (_id, d, ded) in cur.fetchall()}}

    creados = actualizados = sin_cambios = sin_tipo = 0
    for (nro, desc, ded, _legajo, _caracter, _fa, _fb) in CARGOS:
        tid = lookup_tipo.get((desc, ded))
        if tid is None:
            sin_tipo += 1
        cur.execute(
            "SELECT id, tipo_cargo_id FROM departamentos_cargo "
            "WHERE numero_de_cargo=%s", (nro,))
        row = cur.fetchone()
        if row is None:
            if not dry_run:
                cur.execute(
                    "INSERT INTO departamentos_cargo "
                    "(numero_de_cargo,tipo_cargo_id,cargo_departamento_id,"
                    "resolucion_oficializacion_id,observaciones,estado,"
                    "fecha_creacion,fecha_modificacion) "
                    "VALUES (%s,%s,NULL,NULL,NULL,%s,%s,%s)",
                    (nro, tid, "1", now, now))
            creados += 1
        else:
            _id, tipo_old = row
            if tid is not None and tipo_old != tid:
                if not dry_run:
                    cur.execute(
                        "UPDATE departamentos_cargo "
                        "SET tipo_cargo_id=%s, fecha_modificacion=%s WHERE id=%s",
                        (tid, now, _id))
                actualizados += 1
            else:
                sin_cambios += 1
    return creados, actualizados, sin_cambios, sin_tipo


def cargar_historial(cur, dry_run, now):
    # Pre-lookups en memoria
    cur.execute("SELECT id, legajo FROM departamentos_persona WHERE legajo IS NOT NULL")
    legajo_to_persona = {{l: i for (i, l) in cur.fetchall()}}

    cur.execute("SELECT id, persona_id FROM departamentos_docente WHERE estado IN ('1', 'true')")
    persona_to_docente = {{p: i for (i, p) in cur.fetchall()}}

    cur.execute("SELECT id, persona_id FROM departamentos_nodocente WHERE estado IN ('1', 'true')")
    persona_to_nodocente = {{p: i for (i, p) in cur.fetchall()}}

    cur.execute("SELECT id, numero_de_cargo FROM departamentos_cargo")
    nrocargo_to_cargo = {{n: i for (i, n) in cur.fetchall()}}

    cur.execute("SELECT cargo_id FROM departamentos_cargohistorial")
    cargos_con_historial = {{r[0] for r in cur.fetchall()}}

    hoy = date.today()
    creados = ya_existe = sin_persona = sin_ocupante = sin_cargo = 0

    for (nro, _desc, _ded, legajo, caracter, fa, fb) in CARGOS:
        cargo_id = nrocargo_to_cargo.get(nro)
        if cargo_id is None:
            sin_cargo += 1
            continue
        if cargo_id in cargos_con_historial:
            ya_existe += 1
            continue

        persona_id = legajo_to_persona.get(legajo) if legajo else None
        if persona_id is None:
            sin_persona += 1
            continue

        docente_id = no_docente_id = None
        if caracter in CARACTERES_DOCENTE:
            docente_id = persona_to_docente.get(persona_id)
        elif caracter in CARACTERES_NO_DOCENTE:
            no_docente_id = persona_to_nodocente.get(persona_id)

        if docente_id is None and no_docente_id is None:
            sin_ocupante += 1
            continue

        fecha_inicio = date.fromisoformat(fa) if fa else None
        fecha_fin = date.fromisoformat(fb) if fb else None
        if fecha_inicio is None:
            sin_ocupante += 1  # Sin fecha_inicio no se puede insertar
            continue

        motivo_fin = "vencimiento" if (fecha_fin and fecha_fin < hoy) else None

        if not dry_run:
            cur.execute(
                "INSERT INTO departamentos_cargohistorial "
                "(cargo_id, docente_id, no_docente_id, fecha_inicio, fecha_fin, "
                " motivo_fin, observaciones, estado, fecha_creacion, fecha_modificacion) "
                "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                (cargo_id, docente_id, no_docente_id, fecha_inicio, fecha_fin,
                 motivo_fin, "Importado desde Excel.", "1", now, now))
        creados += 1

    return creados, ya_existe, sin_persona, sin_ocupante, sin_cargo


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--solo-tipos", action="store_true")
    args = parser.parse_args()

    print(f"DB: {{DB_CONFIG['user']}}@{{DB_CONFIG['host']}}:{{DB_CONFIG['port']}}/{{DB_CONFIG['dbname']}}")
    if args.dry_run:
        print(">>> DRY-RUN: no se hará COMMIT <<<")
    print()

    conn = psycopg2.connect(**DB_CONFIG)
    try:
        cur = conn.cursor()
        now = datetime.now()

        print("[1/4] TipoCargo con puntaje...")
        c, u, s = cargar_tipos_con_puntaje(cur, args.dry_run, now)
        print(f"     creados={{c}}  actualizados={{u}}  sin_cambios={{s}}")

        print("[2/4] TipoCargo sin puntaje...")
        c, s = cargar_tipos_sin_puntaje(cur, args.dry_run, now)
        print(f"     creados={{c}}  sin_cambios={{s}}")

        if args.solo_tipos:
            print("--solo-tipos: omitiendo Cargo y CargoHistorial.")
        else:
            print(f"[3/4] Cargo (total {{len(CARGOS)}})...")
            c, u, s, sin_tipo = cargar_cargos(cur, args.dry_run, now)
            print(f"     creados={{c}}  actualizados={{u}}  sin_cambios={{s}}  sin_tipo={{sin_tipo}}")

            print(f"[4/4] CargoHistorial...")
            c, ye, sp, so, sc = cargar_historial(cur, args.dry_run, now)
            print(f"     creados={{c}}  ya_existe={{ye}}  sin_persona={{sp}}  sin_ocupante={{so}}  sin_cargo={{sc}}")

        if args.dry_run:
            conn.rollback()
            print("\\nDRY-RUN: rollback ejecutado.")
        else:
            conn.commit()
            print("\\nCOMMIT realizado.")
    except Exception as e:
        conn.rollback()
        print(f"ERROR: {{e}}", file=sys.stderr)
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
'''


if __name__ == "__main__":
    main()
