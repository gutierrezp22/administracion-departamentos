"""Helper local: lee los Excel y genera cargarCargos_embedded.py con
todos los datos inline. Para uso en producción sin SSH/pandas."""

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

df_eq = pd.read_excel(PATH_EQ)
df_eq.columns = ["Cargo", "Descripcion", "Simple", "Part-Time", "Full-Time"]

tipos_puntaje = []
for _, r in df_eq.iterrows():
    sigla = str(r["Cargo"]).strip()
    desc = DESC_MAP[str(r["Descripcion"]).strip()]
    for col, ded in DED_MAP.items():
        p = r[col]
        if pd.isnull(p):
            continue
        tipos_puntaje.append((sigla, desc, ded, float(p)))

df_c = pd.read_html(PATH_C)[0]
covered = {(d, ded) for _, d, ded, _ in tipos_puntaje}
extras = set()
cargos = []
for _, r in df_c.iterrows():
    n = r.get("nrocargo")
    if pd.isnull(n):
        continue
    n = int(n)
    descrip = str(r["descrip"]).strip() if pd.notnull(r["descrip"]) else None
    ded = str(r["dedicacion"]).strip().upper() if pd.notnull(r["dedicacion"]) else None
    if descrip and ded and (descrip, ded) not in covered:
        extras.add((descrip, ded))
    cargos.append((n, descrip, ded))

# Quitar duplicados de nrocargo manteniendo el primero (no debería haber pero por las dudas)
seen = set()
cargos_unique = []
for n, d, ded in cargos:
    if n in seen:
        continue
    seen.add(n)
    cargos_unique.append((n, d, ded))

extras_sorted = sorted(extras)

# Generar el script embebido
lines = []
lines.append('"""')
lines.append("Carga de TipoCargo + Cargo en producción — script autocontenido.")
lines.append("")
lines.append("Generado automáticamente desde los Excel oficiales por _gen_embedded.py.")
lines.append("Solo depende de psycopg2 (ya viene con el backend Django).")
lines.append("")
lines.append("Uso:")
lines.append("    python cargarCargos_embedded.py [--dry-run] [--solo-tipos]")
lines.append("")
lines.append("Requiere las env vars DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT")
lines.append("(ya están configuradas en el contenedor backend de Coolify).")
lines.append('"""')
lines.append("")
lines.append("import argparse")
lines.append("import os")
lines.append("import sys")
lines.append("from datetime import datetime")
lines.append("from decimal import Decimal")
lines.append("")
lines.append("import psycopg2")
lines.append("")
lines.append("DB_CONFIG = {")
lines.append('    "dbname":   os.environ["DB_NAME"],')
lines.append('    "user":     os.environ["DB_USER"],')
lines.append('    "password": os.environ["DB_PASSWORD"],')
lines.append('    "host":     os.environ["DB_HOST"],')
lines.append('    "port":     os.environ.get("DB_PORT", "5432"),')
lines.append("}")
lines.append("")
lines.append("# (sigla, descripcion, dedicacion, puntaje)")
lines.append(f"TIPOS_CON_PUNTAJE = [")
for t in tipos_puntaje:
    lines.append(f"    {t!r},")
lines.append("]")
lines.append("")
lines.append("# (descripcion, dedicacion) — TipoCargo sin puntaje (catálogo)")
lines.append(f"TIPOS_SIN_PUNTAJE = [")
for t in extras_sorted:
    lines.append(f"    {t!r},")
lines.append("]")
lines.append("")
lines.append(f"# (numero_de_cargo, descripcion, dedicacion) — {len(cargos_unique)} cargos")
lines.append(f"CARGOS = [")
for c in cargos_unique:
    lines.append(f"    {c!r},")
lines.append("]")
lines.append("")
lines.append("")
lines.append("def main():")
lines.append('    parser = argparse.ArgumentParser()')
lines.append('    parser.add_argument("--dry-run", action="store_true")')
lines.append('    parser.add_argument("--solo-tipos", action="store_true")')
lines.append("    args = parser.parse_args()")
lines.append("")
lines.append('    print(f"DB: {DB_CONFIG[\'user\']}@{DB_CONFIG[\'host\']}:{DB_CONFIG[\'port\']}/{DB_CONFIG[\'dbname\']}")')
lines.append("    if args.dry_run:")
lines.append('        print(">>> DRY-RUN: no se hará COMMIT <<<")')
lines.append("")
lines.append("    conn = psycopg2.connect(**DB_CONFIG)")
lines.append("    try:")
lines.append("        cur = conn.cursor()")
lines.append("        now = datetime.now()")
lines.append("")
lines.append('        print("[1/3] TipoCargo con puntaje...")')
lines.append("        c1 = u1 = s1 = 0")
lines.append("        for sigla, desc, ded, puntaje in TIPOS_CON_PUNTAJE:")
lines.append('            puntaje = Decimal(str(puntaje)).quantize(Decimal("0.01"))')
lines.append("            cur.execute(")
lines.append('                "SELECT id, sigla, puntaje FROM departamentos_tipocargo "')
lines.append('                "WHERE descripcion=%s AND dedicacion=%s", (desc, ded))')
lines.append("            row = cur.fetchone()")
lines.append("            if row is None:")
lines.append("                if not args.dry_run:")
lines.append("                    cur.execute(")
lines.append('                        "INSERT INTO departamentos_tipocargo "')
lines.append('                        "(sigla,descripcion,dedicacion,puntaje,estado,fecha_creacion,fecha_modificacion) "')
lines.append('                        "VALUES (%s,%s,%s,%s,%s,%s,%s)",')
lines.append('                        (sigla, desc, ded, puntaje, "1", now, now))')
lines.append("                c1 += 1")
lines.append("            else:")
lines.append("                _id, sigla_old, puntaje_old = row")
lines.append("                if sigla_old != sigla or puntaje_old != puntaje:")
lines.append("                    if not args.dry_run:")
lines.append("                        cur.execute(")
lines.append('                            "UPDATE departamentos_tipocargo "')
lines.append('                            "SET sigla=%s, puntaje=%s, fecha_modificacion=%s WHERE id=%s",')
lines.append("                            (sigla, puntaje, now, _id))")
lines.append("                    u1 += 1")
lines.append("                else:")
lines.append("                    s1 += 1")
lines.append('        print(f"     creados={c1}  actualizados={u1}  sin_cambios={s1}")')
lines.append("")
lines.append('        print("[2/3] TipoCargo sin puntaje...")')
lines.append("        c2 = s2 = 0")
lines.append("        for desc, ded in TIPOS_SIN_PUNTAJE:")
lines.append("            cur.execute(")
lines.append('                "SELECT id FROM departamentos_tipocargo "')
lines.append('                "WHERE descripcion=%s AND dedicacion=%s", (desc, ded))')
lines.append("            if cur.fetchone():")
lines.append("                s2 += 1")
lines.append("                continue")
lines.append("            if not args.dry_run:")
lines.append("                cur.execute(")
lines.append('                    "INSERT INTO departamentos_tipocargo "')
lines.append('                    "(sigla,descripcion,dedicacion,puntaje,estado,fecha_creacion,fecha_modificacion) "')
lines.append('                    "VALUES (%s,%s,%s,%s,%s,%s,%s)",')
lines.append('                    ("", desc, ded, None, "1", now, now))')
lines.append("            c2 += 1")
lines.append('        print(f"     creados={c2}  sin_cambios={s2}")')
lines.append("")
lines.append("        if args.solo_tipos:")
lines.append('            print("--solo-tipos: omitiendo Cargo.")')
lines.append("        else:")
lines.append('            print(f"[3/3] Cargo (total {len(CARGOS)})...")')
lines.append("            cur.execute(")
lines.append('                "SELECT id, descripcion, dedicacion FROM departamentos_tipocargo")')
lines.append("            lookup = {(d, ded): _id for (_id, d, ded) in cur.fetchall()}")
lines.append("            c3 = u3 = s3 = sin_tipo = 0")
lines.append("            for nro, desc, ded in CARGOS:")
lines.append("                tid = lookup.get((desc, ded))")
lines.append("                if tid is None:")
lines.append("                    sin_tipo += 1")
lines.append("                cur.execute(")
lines.append('                    "SELECT id, tipo_cargo_id FROM departamentos_cargo "')
lines.append('                    "WHERE numero_de_cargo=%s", (nro,))')
lines.append("                row = cur.fetchone()")
lines.append("                if row is None:")
lines.append("                    if not args.dry_run:")
lines.append("                        cur.execute(")
lines.append('                            "INSERT INTO departamentos_cargo "')
lines.append('                            "(numero_de_cargo,tipo_cargo_id,departamento_id,asignatura_id,"')
lines.append('                            "resolucion_oficializacion_id,observaciones,estado,"')
lines.append('                            "fecha_creacion,fecha_modificacion) "')
lines.append('                            "VALUES (%s,%s,NULL,NULL,NULL,NULL,%s,%s,%s)",')
lines.append('                            (nro, tid, "1", now, now))')
lines.append("                    c3 += 1")
lines.append("                else:")
lines.append("                    _id, tipo_old = row")
lines.append("                    if tid is not None and tipo_old != tid:")
lines.append("                        if not args.dry_run:")
lines.append("                            cur.execute(")
lines.append('                                "UPDATE departamentos_cargo "')
lines.append('                                "SET tipo_cargo_id=%s, fecha_modificacion=%s WHERE id=%s",')
lines.append("                                (tid, now, _id))")
lines.append("                        u3 += 1")
lines.append("                    else:")
lines.append("                        s3 += 1")
lines.append('            print(f"     creados={c3}  actualizados={u3}  sin_cambios={s3}  sin_tipo={sin_tipo}")')
lines.append("")
lines.append("        if args.dry_run:")
lines.append("            conn.rollback()")
lines.append('            print("DRY-RUN: rollback ejecutado.")')
lines.append("        else:")
lines.append("            conn.commit()")
lines.append('            print("COMMIT realizado.")')
lines.append("    except Exception as e:")
lines.append("        conn.rollback()")
lines.append('        print(f"ERROR: {e}", file=sys.stderr)')
lines.append("        raise")
lines.append("    finally:")
lines.append("        conn.close()")
lines.append("")
lines.append("")
lines.append('if __name__ == "__main__":')
lines.append("    main()")

with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")

print(f"Generado: {OUT}")
print(f"  TIPOS_CON_PUNTAJE: {len(tipos_puntaje)}")
print(f"  TIPOS_SIN_PUNTAJE: {len(extras_sorted)}")
print(f"  CARGOS: {len(cargos_unique)}")
