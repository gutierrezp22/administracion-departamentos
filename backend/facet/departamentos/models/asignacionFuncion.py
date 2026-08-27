from django.core.exceptions import ValidationError
from django.db import models

from .base import BaseModel


class AsignacionFuncion(BaseModel):
    """Función asignada a un docente que no es el dictado de una asignatura.

    Corresponde a la columna "Asignación de Funciones" de la planilla
    (ej. "LABORATORIO DE TELECOMUNICACIONES"). No es una asignatura ni un cargo
    de gestión: es una responsabilidad extra asignada por resolución.
    """

    docente = models.ForeignKey(
        'Docente', on_delete=models.CASCADE, related_name='funciones')
    descripcion = models.CharField(
        max_length=200,
        help_text='Función asignada, ej. "Laboratorio de Telecomunicaciones".')
    departamento = models.ForeignKey(
        'Departamento', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='asignaciones_funcion')
    area = models.ForeignKey(
        'Area', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='asignaciones_funcion')
    resolucion = models.ForeignKey(
        'Resolucion', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='asignaciones_funcion')
    expediente = models.CharField(max_length=100, blank=True, null=True)
    fecha_desde = models.DateField(null=True, blank=True)
    fecha_hasta = models.DateField(null=True, blank=True)
    observaciones = models.TextField(blank=True, null=True)
    estado = models.CharField(max_length=1, default='1')

    def clean(self):
        super().clean()
        if self.fecha_hasta and self.fecha_desde and self.fecha_hasta < self.fecha_desde:
            raise ValidationError({
                'fecha_hasta': 'La fecha de fin no puede ser anterior al inicio.',
            })

    def __str__(self):
        quien = self.docente.persona.apellido if self.docente_id else '—'
        return f'{quien} · {self.descripcion}'

    class Meta:
        ordering = ['descripcion']
        verbose_name = 'Asignación de Función'
        verbose_name_plural = 'Asignaciones de Funciones'
