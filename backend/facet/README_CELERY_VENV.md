# 🚀 GUÍA COMPLETA: CÓMO LEVANTAR EL SISTEMA FACET DESDE CERO

## 📋 **PASO A PASO - FUNCIONANDO 100%**

### **🔧 PRERREQUISITOS:**

1. **Redis instalado** en: `D:\Programas\redis\`
2. **Archivo .env** configurado en: `backend/facet/.env`
3. **Venv activado** con dependencias instaladas

---

## 🚀 **INSTRUCCIONES DE INICIO - 3 TERMINALES**

### **🔴 TERMINAL 1: REDIS**

```bash
# Navegar al proyecto
cd D:\Prog\FACET\administracion-departamentos\backend\facet

# Iniciar Redis
.\start_redis.bat
```

**✅ Debe mostrar:** `Redis Server desde D:\Programas\redis`

---

### **🟡 TERMINAL 2: CELERY WORKER**

```bash
# Navegar al proyecto
cd D:\Prog\FACET\administracion-departamentos\backend\facet

# Activar entorno virtual
venv\Scripts\Activate.ps1

# Iniciar Celery Worker
celery -A administracion worker --loglevel=info --pool=solo --concurrency=1 --queues=celery,emails
```

**✅ Debe mostrar:**

- `Connected to redis://localhost:6379/0`
- `celery@Pablo-PC ready.`

---

### **🟢 TERMINAL 3: DJANGO**

```bash
# Navegar al proyecto
cd D:\Prog\FACET\administracion-departamentos\backend\facet

# Activar entorno virtual
venv\Scripts\Activate.ps1

# Iniciar Django
python manage.py runserver
```

**✅ Debe mostrar:** `Starting development server at http://127.0.0.1:8000/`

---

## 🧪 **VERIFICAR QUE FUNCIONA:**

### **1. Verificar Redis:**

```bash
D:\Programas\redis\redis-cli.exe ping
# Debe responder: PONG
```

### **2. Probar envío de email:**

- Ve a tu aplicación web
- Haz clic en "Enviar Notificación"
- **En la terminal de Celery verás:**

```
[INFO] Task departamentos.tasks.enviar_email_notificacion_task received
[INFO] Email enviado exitosamente a tu-email@gmail.com
[INFO] Task succeeded in 3.2s
```

- **El email debe llegar en 3-5 segundos** 📧

---

## ⚠️ **TROUBLESHOOTING:**

### **Error: "Redis no está ejecutándose"**

**Solución:**

```bash
# Verificar Redis
D:\Programas\redis\redis-cli.exe ping

# Si no responde, iniciar manualmente:
D:\Programas\redis\redis-server.exe --port 6379
```

### **Error: "Unable to load celery application"**

**Solución:**

- Asegúrate de estar en: `backend/facet/`
- Activar venv: `venv\Scripts\Activate.ps1`
- Verificar que existe: `administracion/` y `manage.py`

### **Error: "No llegan emails"**

**Solución:**

1. Verificar archivo `.env` existe en `backend/facet/.env`
2. Si está en `administracion/.env`, copiarlo:

```bash
copy administracion\.env .env
```

### **Emails se quedan "PENDING"**

**Solución:**

- **Celery Worker NO está corriendo**
- Iniciar Worker en nueva terminal (Terminal 2)

---

## 📁 **ESTRUCTURA DE ARCHIVOS CORRECTA:**

```
D:\Prog\FACET\administracion-departamentos\
└── backend\facet\
    ├── .env                 ← ¡IMPORTANTE! Aquí debe estar
    ├── administracion\
    ├── manage.py
    ├── venv\
    ├── start_redis.bat
    └── start_celery.bat
```

---

## 🎯 **ORDEN DE INICIO (CRÍTICO):**

1. **PRIMERO:** Redis
2. **SEGUNDO:** Celery Worker
3. **TERCERO:** Django

---

## ✅ **CONFIGURACIÓN .env CORRECTA:**

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=tu-email@gmail.com
EMAIL_HOST_PASSWORD=tu-contraseña-de-aplicacion
DEFAULT_FROM_EMAIL=tu-email@gmail.com

# Celery Configuration
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

---

## 🎉 **¡SISTEMA FUNCIONANDO!**

- ✅ **Redis:** Funcionando
- ✅ **Celery Worker:** Procesando tareas automáticamente
- ✅ **Django:** Enviando tareas a Celery
- ✅ **Emails:** Llegando en 3-5 segundos

**¡Ahora puedes enviar notificaciones automáticamente!** 🚀

---

# 🚀 Configuración de Celery para Envío de Emails - FACET

Esta guía te ayudará a configurar Celery para el envío asíncrono de emails y evitar que lleguen al spam.

## 📋 Requisitos Previos

### 1. Instalar Redis

```bash
# Windows (usando Chocolatey)
choco install redis-64

# Windows (usando Scoop)
scoop install redis

# O descargar desde: https://github.com/microsoftarchive/redis/releases
```

### 2. Instalar Dependencias Python

```bash
pip install celery redis django-celery-beat django-celery-results
```

## ⚙️ Configuración

### 1. Variables de Entorno

Crea un archivo `.env` basado en `env_example.txt`:

```env
# Configuración de Email - Gmail (Recomendado)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=true
EMAIL_HOST_USER=tu-email@gmail.com
EMAIL_HOST_PASSWORD=tu-app-password  # ⚠️ Usar contraseña de aplicación
DEFAULT_FROM_EMAIL=Sistema FACET <tu-email@gmail.com>

# Configuración de Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

### 2. Configurar Contraseña de Aplicación (Gmail)

**⚠️ IMPORTANTE: No uses tu contraseña normal de Gmail**

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Seguridad → Verificación en 2 pasos (debe estar activada)
3. Contraseñas de aplicaciones
4. Selecciona "Correo" y tu dispositivo
5. Usa la contraseña generada en `EMAIL_HOST_PASSWORD`

### 3. Migrar Base de Datos

```bash
python manage.py makemigrations
python manage.py migrate
```

## 🚀 Ejecutar el Sistema

### Opción 1: Scripts Automáticos (Windows)

1. **Iniciar Redis:**

   ```bash
   ./start_redis.bat
   ```

2. **Iniciar Celery (en otra terminal):**

   ```bash
   ./start_celery.bat
   ```

3. **Iniciar Django:**
   ```bash
   python manage.py runserver
   ```

### Opción 2: Comandos Manuales

1. **Redis:**

   ```bash
   redis-server --port 6379
   ```

2. **Celery Worker:**

   ```bash
   celery -A administracion worker --loglevel=info --pool=solo
   ```

3. **Celery Beat (tareas programadas):**
   ```bash
   celery -A administracion beat --loglevel=info --scheduler=django_celery_beat.schedulers:DatabaseScheduler
   ```

## 📧 Configuración Anti-SPAM

### Para Gmail:

- ✅ Usa contraseña de aplicación
- ✅ Verificación en 2 pasos activada
- ✅ Dirección `From` válida
- ✅ Contenido del email profesional

### Para otros proveedores:

**Outlook/Hotmail:**

```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
```

**Yahoo:**

```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
```

### Buenas Prácticas:

1. **Dominio propio**: Usa un dominio personalizado si es posible
2. **SPF Record**: Configura registros SPF en tu DNS
3. **DKIM**: Habilita DKIM en tu proveedor
4. **Contenido**: Evita palabras como "URGENTE", exceso de mayúsculas
5. **Rate Limiting**: No envíes muchos emails muy rápido

## 🧪 Probar la Configuración

### 1. Test de Email (Solo desarrollo)

```bash
curl -X POST http://localhost:8000/api/facet/notificacion/test_email/ \
  -H "Content-Type: application/json" \
  -d '{"email": "tu-email@gmail.com"}'
```

### 2. Test de Celery

```python
# En Django shell
python manage.py shell

from departamentos.tasks import enviar_email_notificacion_task
result = enviar_email_notificacion_task.delay(1, "Mensaje de prueba")
print(result.id)
```

### 3. Verificar Estado de Tarea

```bash
curl http://localhost:8000/api/facet/notificacion/estado_tarea/TASK_ID/
```

## 📊 Monitoreo

### Ver Logs de Celery:

```bash
tail -f logs/celery.log
```

### Flower (Monitor Web):

```bash
pip install flower
celery -A administracion flower
# Accede a: http://localhost:5555
```

## 🐛 Solución de Problemas

### Error: "Broker connection refused"

- ✅ Verifica que Redis esté corriendo
- ✅ Verifica la URL del broker en `.env`

### Emails no llegan:

- ✅ Verifica configuración de email en `.env`
- ✅ Revisa logs: `logs/celery.log`
- ✅ Usa contraseña de aplicación (no la normal)

### Error en Windows:

- ✅ Usa `--pool=solo` en lugar de threads
- ✅ Ejecuta como administrador si es necesario

### Emails van a SPAM:

- ✅ Configura SPF/DKIM
- ✅ Usa dominio propio
- ✅ Evita contenido "spammy"

## 📝 **Comandos Útiles:**

```bash
# Ver tareas activas
celery -A administracion inspect active

# Ver workers disponibles
celery -A administracion inspect stats

# Limpiar cola de tareas
celery -A administracion purge

# Reiniciar workers
celery -A administracion control pool_restart
```

## 🎯 **Próximos Pasos Opcionales:**

1. **Templates HTML**: Crear emails más atractivos
2. **Múltiples Colas**: Separar emails urgentes de normales
3. **Notificaciones Push**: Integrar con Firebase
4. **Dashboard**: Monitor personalizado de tareas

---

**🎉 ¡El sistema está listo para usar!**

Los emails ahora se envían de forma asíncrona y profesional, evitando que lleguen al spam.
