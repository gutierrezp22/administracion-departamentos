from django.db import models
from .base import BaseModel


class TipoCargo(BaseModel):
    """Catálogo de tipos de cargo docente con su puntaje equivalente.

    descripcion + dedicacion identifican de forma única un tipo (ej. PROFESOR
    TITULAR + EXCL). El puntaje es nullable: los tipos sin equivalencia (Decano,
    AUX SEGUNDA, 35HS, etc.) existen en el catálogo pero no participan en
    descomposición/combinación.

    `codigo` es el código numérico oficial de la UNT (705 = Titular Exclusiva,
    716 = Adjunto Semi, etc.). Es el que aparece en las designaciones, en las
    liquidaciones y en SIU, así que es la clave real de importación.
    """

    DEDICACION_CHOICES = [
        ('SIMP', 'Simple'),
        ('SEMI', 'Semi (Part-Time)'),
        ('EXCL', 'Exclusiva (Full-Time)'),
        ('35HS', '35 Horas'),
    ]

    RANGO_CHOICES = [
        ('TITULAR', 'Titular'),
        ('ASOCIADO', 'Asociado'),
        ('ADJUNTO', 'Adjunto'),
        ('JTP', 'JTP'),
        ('ADG', 'Auxiliar Docente de Primera'),
        ('AUX2', 'Auxiliar Docente de Segunda'),
        ('GESTION', 'Cargo de gestión'),
        ('NODOCENTE', 'No docente'),
    ]

    codigo = models.PositiveIntegerField(
        null=True, blank=True, unique=True,
        help_text='Código oficial UNT del cargo (705, 706, 709, 716, 740…). '
                  'Es la clave de cruce con designaciones, liquidación y SIU.')
    sigla = models.CharField(
        max_length=10, blank=True, null=True,
        help_text='Sigla corta (ADG, JTP, ADJ, ASO, TIT). Vacía para tipos sin puntaje.')
    descripcion = models.CharField(
        max_length=100,
        help_text='Descripción tal como aparece en el sistema de origen (ej. PROFESOR TITULAR).')
    dedicacion = models.CharField(max_length=10, choices=DEDICACION_CHOICES)
    rango = models.CharField(
        max_length=10, choices=RANGO_CHOICES, blank=True, null=True,
        help_text='Rango normalizado, usado para agrupar en el reporte de planta.')
    horas_semanales = models.PositiveSmallIntegerField(
        null=True, blank=True,
        help_text='Carga horaria semanal del cargo (40 exclusiva, 20 semi, 10 simple).')
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

    @property
    def denominacion(self):
        """Etiqueta corta para el reporte: "Titular Exclusiva"."""
        DED = {'EXCL': 'Exclusiva', 'SEMI': 'Semiexclusiva',
               'SIMP': 'Simple', '35HS': '35 Hs'}
        rango = self.get_rango_display() if self.rango else self.descripcion
        return f'{rango} {DED.get(self.dedicacion, self.dedicacion)}'

    def __str__(self):
        puntaje = f' = {self.puntaje}' if self.puntaje is not None else ''
        codigo = f'{self.codigo} · ' if self.codigo else ''
        return f'{codigo}{self.descripcion} ({self.dedicacion}){puntaje}'
