from django.db import models
from .base import BaseModel


class Director(BaseModel):
    persona = models.OneToOneField(
        'Persona', models.CASCADE)
    
    observaciones = models.TextField(blank=True, null=True)
    estado = models.CharField(max_length=1)

    def __str__(self):
        return f"{self.persona.apellido,self.estado}"

    class Meta:
        ordering = ['id']
        verbose_name = 'Director'
        verbose_name_plural = 'Directores'