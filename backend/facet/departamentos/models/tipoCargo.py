from django.db import models
from .base import BaseModel


class TipoCargo(BaseModel):
    """Catálogo de tipos de cargo docente con su puntaje equivalente.

    descripcion + dedicacion identifican de forma única un tipo (ej. PROFESOR
    TITULAR + EXCL). El puntaje es nullable: los tipos sin equivalencia (Decano,
    AUX SEGUNDA, 35HS, etc.) existen en el catálogo pero no participan en
    descomposición/combinación.
    """

    DEDICACION_CHOICES = [
        ('SIMP', 'Simple'),
        ('SEMI', 'Semi (Part-Time)'),
        ('EXCL', 'Exclusiva (Full-Time)'),
        ('35HS', '35 Horas'),
    ]

    sigla = models.CharField(
        max_length=10, blank=True, null=True,
        help_text='Sigla corta (ADG, JTP, ADJ, ASO, TIT). Vacía para tipos sin puntaje.')
    descripcion = models.CharField(
        max_length=100,
        help_text='Descripción tal como aparece en el sistema de origen (ej. PROFESOR TITULAR).')
    dedicacion = models.CharField(max_length=10, choices=DEDICACION_CHOICES)
    puntaje = models.DecimalField(
        max_digits=4, decimal_places=2, null=True, blank=True,
        help_text='Puntaje equivalente. Null si el tipo no participa en combinatoria.')
    observaciones = models.TextField(blank=True, null=True)
    estado = models.CharField(max_length=1, default='1')

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['descripcion', 'dedicacion'],
                name='unique_tipocargo_descripcion_dedicacion',
            ),
        ]
        ordering = ['descripcion', 'dedicacion']
        verbose_name = 'Tipo de Cargo'
        verbose_name_plural = 'Tipos de Cargo'

    def __str__(self):
        puntaje = f' = {self.puntaje}' if self.puntaje is not None else ''
        return f'{self.descripcion} ({self.dedicacion}){puntaje}'
