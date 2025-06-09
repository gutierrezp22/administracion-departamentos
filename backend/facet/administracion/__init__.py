# Importar Celery para que se cargue automáticamente cuando Django inicie
from .celery import app as celery_app

__all__ = ('celery_app',)
