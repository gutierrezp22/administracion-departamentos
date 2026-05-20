# Cargar cargos en producción (Coolify, sin SSH)

Esta guía es para el caso en que **no hay SSH al servidor** de Coolify.
Usa el script autocontenido `cargarCargos_embedded.py` (datos
embebidos) y el campo **Post-deployment Command** de Coolify para
correrlo dentro del contenedor backend.

El script es idempotente: re-ejecutarlo no duplica datos.

## Pre-requisito: migraciones de Django

Las migraciones 0005→0010 (que crean las tablas Cargo, TipoCargo,
CargoHistorial, OperacionCargo) deben aplicarse antes que el script de
seed. Por eso configuramos **DOS** comandos:

**Pre-deployment Command:**
```
/opt/venv/bin/python manage.py migrate --noinput
```

**Post-deployment Command:**
```
/opt/venv/bin/python scripts/cargarCargos_embedded.py
```

> **Importante**: usar el path completo `/opt/venv/bin/python`, no
> solo `python`. Nixpacks crea el virtualenv en `/opt/venv` y los
> paquetes (Django, psycopg2) están instalados ahí. Si usás solo
> `python` el comando corre con el python del sistema sin paquetes
> y falla con `ModuleNotFoundError`.

## Qué carga el script

1. **TipoCargo con puntaje** — 15 entradas (5 siglas × 3 dedicaciones)
   del catálogo de equivalencias.
2. **TipoCargo sin puntaje** — 10 entradas para descripciones del
   sistema sin equivalencia (DECANO, Categoria Dto.366, AUX 2da, etc.).
3. **Cargo** — 958 cargos por `numero_de_cargo`, vinculados a su
   TipoCargo (departamento/asignatura/resolución quedan en NULL para
   completar después por la UI).
4. **CargoHistorial** — vínculo cargo ↔ persona. Matchea por
   `Persona.legajo` (campo público, no se incluye CUIL/DNI en el repo).
   Según el `caracter` del Excel decide si el ocupante es Docente
   (D-OR/D-IN/DAUX/D-NM) o NoDocente (ND-P/S-02). Setea fecha_inicio,
   fecha_fin, y motivo_fin='vencimiento' si la fecha_fin ya pasó.

**Pre-requisitos en producción:**
- Las Personas (con su `legajo`) ya deben estar cargadas (por
  `cargarPersonas.py` / `cargarNoDocentes.py`).
- Los Docente / NoDocente para esas Personas también.

Si falta alguna Persona, el script reporta `sin_persona=N` y omite
ese historial pero igual carga el Cargo. Es seguro re-correrlo
después de completar las Personas.

---

## Archivos relevantes

| Archivo                              | Propósito                                                                 |
|--------------------------------------|---------------------------------------------------------------------------|
| `cargarCargos.py`                    | Versión "buena" — lee de Excel. Útil para correr local con `--dry-run`.   |
| `cargarCargos_embedded.py`           | **El que se corre en producción.** Datos inline, solo necesita psycopg2. |
| `_gen_embedded.py`                   | Regenera el embedded a partir de los Excel (solo si cambian las fuentes).|
| `Tabla de Cargos Docentes.xlsx`      | Catálogo de puntajes (fuente).                                            |
| `e_13_04_2026.xls`                   | Cargos reales (fuente, 958 filas).                                        |

> **No commitear los Excel** — el script embebido ya tiene los datos.

---

## 1) Commit + push del script embebido

```powershell
git add backend/facet/scripts/cargarCargos.py `
        backend/facet/scripts/cargarCargos_embedded.py `
        backend/facet/scripts/_gen_embedded.py `
        backend/facet/scripts/CARGAR_CARGOS_PROD.md
git commit -m "feat(scripts): cargarCargos embebido para TipoCargo + Cargo"
git push origin main
```

---

## 2) Redesplegar el backend en Coolify

1. UI de Coolify → `Projects → Gestión de los Departamentos → production → backend`
2. Click **Redeploy**.
3. Esperar a que la pestaña **Deployments** marque "successful".

Tras el deploy, dentro del contenedor existe:
`/app/backend/facet/scripts/cargarCargos_embedded.py`

(la `Base Directory` configurada en Coolify es `/backend/facet`, y el
working dir del contenedor monta el repo en `/app`).

---

## 3) Configurar Post-deployment Command (recomendado)

La forma más simple y robusta: aprovechar el campo
**Post-deployment** del backend en Coolify. Como el script es
idempotente, se puede dejar permanentemente — la primera vez crea
los 998 registros, en deploys posteriores se ejecuta en ~2s y reporta
`sin_cambios=998`.

1. UI de Coolify → `backend → Configuration → General`.
2. Scroll hasta **Pre/Post Deployment Commands** (al final del form).
3. En el campo **Post-deployment** pegar:
   ```
   /opt/venv/bin/python scripts/cargarCargos_embedded.py
   ```
4. Click **Save**.
5. Volver al panel del backend y click **Redeploy**.
6. En la pestaña **Deployments** vas a ver al final del log la salida
   del script (ver "Output esperado" más abajo).

> **Pre vs Post**: Pre corre antes de que el container nuevo esté
> listo. Post corre cuando el container ya está sirviendo. Para data
> seeding usamos **Post** porque necesitamos que la DB sea
> alcanzable y que las migraciones ya hayan corrido.

### Alternativa: Scheduled Tasks (si preferís dispararlo manualmente)

Si no querés que corra en cada deploy:

1. UI → `backend → Scheduled Tasks` (link en el sidebar izquierdo).
2. Click en **+ New / Add**.
3. Completar:
   - **Name**: `cargar-cargos`
   - **Command**: `/opt/venv/bin/python scripts/cargarCargos_embedded.py`
   - **Frequency** / **Schedule**: cualquier cron lejano (ej. `0 0 1 1 0`) — se dispara manualmente.
   - **Container**: backend (default).
4. Guardar y click **Run** (botón ▶ o "Trigger now") en la lista de tasks.
5. Ver el output en los logs del task.

Para hacer dry-run primero, agregar ` --dry-run` al final del Command.

**Output esperado del dry-run** (producción aún vacía):

```
DB: <user>@<host>:5432/<dbname>
>>> DRY-RUN: no se hará COMMIT <<<
[1/3] TipoCargo con puntaje...
     creados=15  actualizados=0  sin_cambios=0
[2/3] TipoCargo sin puntaje...
     creados=10  sin_cambios=0
[3/3] Cargo (total 958)...
     creados=958  actualizados=0  sin_cambios=0  sin_tipo=0
DRY-RUN: rollback ejecutado.
```

Si ves `sin_tipo > 0`, **NO** ejecutes el real — quiere decir que hay
cargos sin TipoCargo matcheado y algo cambió en los datos.

---

## 4) Output esperado

En el log del deploy (o del task) vas a ver al final:

**Primer deploy** (DB vacía de cargos, con Personas ya cargadas):
```
DB: <user>@<host>:5432/<dbname>
[1/4] TipoCargo con puntaje...
     creados=15  actualizados=0  sin_cambios=0
[2/4] TipoCargo sin puntaje...
     creados=10  sin_cambios=0
[3/4] Cargo (total 958)...
     creados=958  actualizados=0  sin_cambios=0  sin_tipo=0
[4/4] CargoHistorial...
     creados=958  ya_existe=0  sin_persona=0  sin_ocupante=0  sin_cargo=0
COMMIT realizado.
```

**Deploys siguientes** (datos ya cargados — idempotente):
```
[1/4] TipoCargo con puntaje:    sin_cambios=15
[2/4] TipoCargo sin puntaje:    sin_cambios=10
[3/4] Cargo (total 958):        sin_cambios=958  sin_tipo=0
[4/4] CargoHistorial:           ya_existe=958
COMMIT realizado.
```

**Si las Personas todavía no están cargadas:**
```
[3/4] Cargo (total 958): creados=958
[4/4] CargoHistorial: creados=0  sin_persona=958
```
Esto NO es un error — los Cargos se crearon. Re-correr después de
cargar las Personas y el script completará los CargoHistorial.

**Banderas de problema:**
- `sin_tipo > 0` después del 1er deploy → cambió la fuente, regenerar embedded.
- `sin_ocupante > 0` → hay Personas sin su Docente/NoDocente asociado.
- `sin_cargo > 0` → bug del script (no debería pasar).

---

## 5) Verificar en la app

1. Abrir https://docentes.facet.unt.edu.ar
2. Login y ir a `Cargos → Lista de cargos`
3. Confirmar que aparecen los 958 cargos con sus tipos vinculados (sigla, dedicación, puntaje).

---

## 6) Limpiar (opcional)

- Si querés que el task no quede corriendo en el cron, podés
  desactivarlo desde la UI ("Enabled" toggle) o borrarlo.
- O dejarlo deshabilitado por si más adelante hay que re-ejecutar.

---

## Notas

- **Idempotencia**: el script chequea existencia antes de insertar y
  actualiza por (descripcion, dedicacion) para TipoCargo y por
  `numero_de_cargo` para Cargo. Se puede re-correr sin riesgo.
- **Transaccionalidad**: si algo falla en el medio se hace `rollback`.
- **Datos no tocados**: el script NO toca Persona, CargoHistorial,
  OperacionCargo, Departamento, Asignatura ni Resolucion. Solo crea
  Cargo con FKs nulas a Departamento/Asignatura/Resolucion (que el
  modelo permite). La vinculación se hace después por la UI.
- **`--solo-tipos`**: si querés cargar primero el catálogo y los
  cargos individuales después: `--solo-tipos`.

---

## Regenerar el embedded (si cambian los Excel)

```powershell
# desde backend/facet
.\venv\Scripts\python.exe scripts\_gen_embedded.py
```

Esto reescribe `cargarCargos_embedded.py` con los datos actualizados
de los Excel que estén en `scripts/`.
