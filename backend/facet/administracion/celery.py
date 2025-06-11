import os
from celery import Celery
from django.conf import settings

# Establecer el módulo de configuración de Django para Celery
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'administracion.settings')

# Crear la instancia de Celery
app = Celery('administracion')

# Configurar Celery usando la configuración de Django
app.config_from_object('django.conf:settings', namespace='CELERY')

# Autodiscovery de tareas en todas las aplicaciones de Django
app.autodiscover_tasks()

# Configuración adicional
app.conf.update(
    # Configuración de time zone
    timezone='America/Argentina/Buenos_Aires',
    enable_utc=True,
    
    # Configuración de broker
    broker_url='redis://localhost:6379/0',
    result_backend='redis://localhost:6379/0',
    
    # Configuración de resultados
    result_expires=3600,
    
    # Configuración de serialización
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    
    # Configuración de routing
    task_routes={
        'departamentos.tasks.*': {'queue': 'emails'},
    },
    
    # Configuración de reintentos
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    
    # Configuración de beat (tareas programadas)
    beat_schedule={
        'verificar-documentaciones-diario': {
            'task': 'departamentos.tasks.verificar_documentaciones_task',
            'schedule': 86400.0,  # Cada 24 horas
        },
    },
)

@app.task(bind=True)
def debug_task(self):
    """Tarea de prueba para debug"""
    print(f'Request: {self.request!r}') 