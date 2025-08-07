import pandas as pd
import psycopg2
from datetime import datetime

DB_CONFIG = {
    'dbname': 'administracion-departamentos',
    'user': 'admin',
    'password': '1234',
    'host': 'localhost',
    'port': '5432',
}

file_path = r"D:\Prog\administracion-departamentos\administracion-departamentos\backend\facet\scripts\Julio2025.xlsx"
data = pd.read_excel(file_path)

def extraer_dni(cuil):
    return cuil[2:10]

try:
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()

    for index, row in data.iterrows():
        caracter = str(row['caracter']).strip().upper()
        if not caracter.startswith("ND"):
            continue

        legajo = str(row['nrolegajoaux'])
        cuil = str(row['cuil'])
        apellido = str(row['apellido']).strip().upper()
        nombre = str(row['nombre']).strip().upper()
        dni = extraer_dni(cuil)
        fecha_nacimiento = row['fechanac'] if pd.notnull(row['fechanac']) else None
        observaciones = str(row['descrip']).strip() if pd.notnull(row['descrip']) else None
        estado = 1  # valor numérico ahora correcto
        fecha_creacion = datetime.now()
        fecha_modificacion = datetime.now()

        # Verificar si la persona ya existe
        cursor.execute("SELECT id FROM departamentos_persona WHERE dni = %s", (dni,))
        result = cursor.fetchone()

        if result:
            persona_id = result[0]
            # Actualizar estado a 1 por si tenía otro valor
            cursor.execute("""
                UPDATE departamentos_persona 
                SET estado = %s, fecha_modificacion = %s 
                WHERE id = %s
            """, (estado, fecha_modificacion, persona_id))
            print(f"✔ Persona actualizada (estado = 1) - DNI {dni}, ID: {persona_id}")
        else:
            cursor.execute("""
                INSERT INTO departamentos_persona
                (dni, apellido, nombre, estado, legajo, fecha_nacimiento, fecha_creacion, fecha_modificacion)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
            """, (dni, apellido, nombre, estado, legajo, fecha_nacimiento, fecha_creacion, fecha_modificacion))
            persona_id = cursor.fetchone()[0]
            print(f"🆕 Persona creada con estado = 1 (DNI {dni}) ID: {persona_id}")

        # Verificar si NoDocente ya existe
        cursor.execute("SELECT COUNT(*) FROM departamentos_nodocente WHERE persona_id = %s", (persona_id,))
        existe_nodocente = cursor.fetchone()[0]

        if not existe_nodocente:
            cursor.execute("""
                INSERT INTO departamentos_nodocente
                (persona_id, observaciones, estado, fecha_creacion, fecha_modificacion)
                VALUES (%s, %s, %s, %s, %s)
            """, (persona_id, observaciones, estado, fecha_creacion, fecha_modificacion))
            print(f"➡ NoDocente creado con estado = 1 para persona ID {persona_id}")
        else:
            # Actualizar el estado si ya existe
            cursor.execute("""
                UPDATE departamentos_nodocente 
                SET estado = %s, fecha_modificacion = %s 
                WHERE persona_id = %s
            """, (estado, fecha_modificacion, persona_id))
            print(f"♻ NoDocente ya existía — estado actualizado a 1 (persona ID {persona_id})")

    conn.commit()
    print("✅ Proceso finalizado correctamente con actualizaciones.")

except Exception as e:
    print(f"❌ Error: {e}")

finally:
    if conn:
        cursor.close()
        conn.close()
