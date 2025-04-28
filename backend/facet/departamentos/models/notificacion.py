from django.db import models
from .base import BaseModel  # Importamos BaseModel
from .persona import Persona

class Notificacion(BaseModel):  # Hereda de BaseModel
    persona = models.ForeignKey(Persona, on_delete=models.CASCADE)
    mensaje = models.TextField()
    leido = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notificación para {self.persona.apellido}: {self.mensaje}"

    class Meta:
        ordering = ['-fecha_creacion']
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'
