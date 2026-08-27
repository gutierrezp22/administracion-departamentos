from django.core.exceptions import ValidationError
from django.db import models

from .base import BaseModel


class Licencia(BaseModel):
    """Licencia de un docente sobre un cargo.

    En la planilla es la columna "Licencias" (ej. "Lic. s/goce de sueldo | 706 |
    Expte 387..."). Importa para el reporte porque un cargo con licencia sigue
    ocupado pero el docente no lo está ejerciendo, y suele haber un suplente.
    """

    TIPO_CHOICES = [
        ('sin_goce', 'Sin goce de sueldo'),
        ('con_goce', 'Con goce de sueldo'),
        ('cargo_mayor_jerarquia', 'Por cargo de mayor jerarquía'),
        ('maternidad', 'Maternidad / paternidad'),
        ('enfermedad', 'Enfermedad de largo tratamiento'),
        ('estudio', 'Beca / estudio'),
        ('otra', 'Otra'),
    ]

    docente = models.ForeignKey(
        'Docente', on_delete=models.CASCADE, related_name='licencias')
    tipo = models.CharField(max_length=25, choices=TIPO_CHOICES)
    codigo_cargo = models.PositiveIntegerField(
        null=True, blank=True,
        help_text='Código UNT del cargo sobre el que se toma la licencia.')
    cargo_departamento = models.ForeignKey(
        'CargoDepartamento', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='licencias')
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField(
        null=True, blank=True,
        help_text='Vacío = licencia vigente sin fecha de reintegro.')
    resolucion = models.ForeignKey(
        'Resolucion', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='licencias')
    expediente = models.CharField(max_length=100, blank=True, null=True)
    reemplazante = models.ForeignKey(
        'Docente', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='reemplazos',
        help_text='Docente que cubre el cargo durante la licencia, si lo hay.')
    observaciones = models.TextField(blank=True, null=True)
    estado = models.CharField(max_length=1, default='1')

    def vigente_a(self, fecha):
        if self.fecha_inicio > fecha:
            return False
        return self.fecha_fin is None or self.fecha_fin >= fecha

    def clean(self):
        super().clean()
        if self.fecha_fin and self.fecha_fin < self.fecha_inicio:
            raise ValidationError({
                'fecha_fin': 'La fecha de fin no puede ser anterior al inicio.',
            })
        if self.reemplazante_id and self.reemplazante_id == self.docente_id:
            raise ValidationError({
                'reemplazante': 'El reemplazante no puede ser el mismo docente.',
            })

    def __str__(self):
        quien = self.docente.persona.apellido if self.docente_id else '—'
        return f'{quien} · {self.get_tipo_display()} ({self.fecha_inicio})'

    class Meta:
        ordering = ['-fecha_inicio', '-id']
        verbose_name = 'Licencia'
        verbose_name_plural = 'Licencias'
