from django.db import models

from .base import BaseModel


class Seguimiento(BaseModel):
    """Novedad de seguimiento de un docente por parte del departamento.

    Reemplaza las columnas "seguimientos DEEC" / "novedad SEGUIMIENTO" de la
    planilla, que hoy guardan en texto libre cosas como
    "revisar cobro de sueldo | 30/07/2026 | problemas DGPRES | Depto Personal".
    """

    TIPO_CHOICES = [
        ('ea_iniciar', 'Iniciar evaluación académica'),
        ('regularizar_cargo', 'Regularizar cargo'),
        ('cobro_sueldo', 'Revisar cobro de sueldo'),
        ('di_no_genuina', 'Designación interina no genuina'),
        ('renovacion', 'Renovación pendiente'),
        ('concurso', 'Llamado a concurso'),
        ('jubilacion', 'Trámite jubilatorio'),
        ('licencia', 'Licencia'),
        ('otro', 'Otro'),
    ]

    ESTADO_SEG_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('en_curso', 'En curso'),
        ('resuelto', 'Resuelto'),
        ('descartado', 'Descartado'),
    ]

    PRIORIDAD_CHOICES = [
        ('alta', 'Alta'),
        ('media', 'Media'),
        ('baja', 'Baja'),
    ]

    docente = models.ForeignKey(
        'Docente', on_delete=models.CASCADE, related_name='seguimientos')
    tipo = models.CharField(max_length=25, choices=TIPO_CHOICES, default='otro')
    descripcion = models.TextField(
        help_text='Qué hay que hacer, ej. "revisar cobro de sueldo".')
    fecha_novedad = models.DateField(
        help_text='Fecha de la novedad que dispara el seguimiento.')
    fecha_resolucion = models.DateField(null=True, blank=True)
    responsable = models.CharField(
        max_length=120, blank=True, null=True,
        help_text='Área u oficina responsable, ej. "Depto Personal".')
    prioridad = models.CharField(
        max_length=10, choices=PRIORIDAD_CHOICES, default='media')
    estado_seguimiento = models.CharField(
        max_length=12, choices=ESTADO_SEG_CHOICES, default='pendiente')
    designacion = models.ForeignKey(
        'Designacion', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='seguimientos',
        help_text='Designación a la que se refiere la novedad, si aplica.')
    observaciones = models.TextField(blank=True, null=True)
    estado = models.CharField(max_length=1, default='1')

    @property
    def abierto(self):
        return self.estado_seguimiento in ('pendiente', 'en_curso')

    def __str__(self):
        quien = self.docente.persona.apellido if self.docente_id else '—'
        return f'{quien}: {self.descripcion[:40]} ({self.fecha_novedad})'

    class Meta:
        ordering = ['-fecha_novedad', '-id']
        verbose_name = 'Seguimiento'
        verbose_name_plural = 'Seguimientos'
        indexes = [
            models.Index(fields=['docente', 'estado_seguimiento']),
        ]
