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
- ✅ No envíes muchos emails rapidamente

## 📈 Funcionalidades Implementadas

### ✅ Envío Asíncrono

- Los emails se procesan en background
- No bloquea la interfaz de usuario
- Reintentos automáticos en caso de error

### ✅ Notificaciones Automáticas

- Verificación diaria de vencimientos
- Notificaciones 30 días antes del vencimiento
- Evita duplicados

### ✅ Estado de Tareas

- Consulta el estado de envío
- Logs detallados
- Manejo de errores

### ✅ Frontend Actualizado

- Feedback inmediato al usuario
- Indicadores visuales de estado
- Recarga automática de datos

## 🔧 Comandos Útiles

```bash
# Ver tareas activas
celery -A administracion inspect active

# Ver workers
celery -A administracion inspect stats

# Purgar todas las tareas
celery -A administracion purge

# Reiniciar workers
celery -A administracion control pool_restart

# Ver rutas de tareas
celery -A administracion inspect registered
```

## 🎯 Próximos Pasos

1. **Producción**: Usar supervisor o systemd
2. **Escalabilidad**: Múltiples workers
3. **Monitoreo**: Implementar alertas
4. **Templates**: HTML emails con plantillas
5. **Queue**: Diferentes colas para diferentes tipos de tareas

---

**📞 Soporte**: Si tienes problemas, revisa los logs en `logs/celery.log` y verifica que Redis esté corriendo.
