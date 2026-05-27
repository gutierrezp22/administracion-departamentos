from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from .base import BaseModel


class CargoHistorial(BaseModel):
    MOTIVO_FIN_CHOICES = [
        ('designacion', 'Designación'),
        ('vencimiento', 'Vencimiento'),
        ('renuncia', 'Renuncia'),
        ('licencia', 'Licencia'),
        ('baja', 'Baja'),
        ('vacante', 'Vacante'),
        ('otro', 'Otro'),
    ]

    cargo_departamento = models.ForeignKey(
        'CargoDepartamento', on_delete=models.CASCADE, related_name='historial')
    docente = models.ForeignKey(
        'Docente', on_delete=models.SET_NULL, null=True, blank=True,
        help_text='Ocupante docente. Mutuamente exclusivo con no_docente.')
    no_docente = models.ForeignKey(
        'NoDocente', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='historial_cargos',
        help_text='Ocupante no-docente. Mutuamente exclusivo con docente.')
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField(
        null=True, blank=True,
        help_text='Si es null el período sigue vigente')
    resolucion = models.ForeignKey(
        'Resolucion', on_delete=models.SET_NULL, null=True, blank=True)
    motivo_fin = models.CharField(
        max_length=20, choices=MOTIVO_FIN_CHOICES, blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)
    estado = models.CharField(max_length=1, default='1')

    def clean(self):
        super().clean()
        if self.docente and self.no_docente:
            raise ValidationError('docente y no_docente son mutuamente exclusivos.')
        if self.fecha_fin and self.fecha_fin < self.fecha_inicio:
            raise ValidationError({'fecha_fin': 'fecha_fin no puede ser anterior a fecha_inicio.'})

        # Sin solapamiento de períodos para el mismo Cargo de Departamento (estado activo).
        overlap = CargoHistorial.objects.filter(
            cargo_departamento=self.cargo_departamento, estado='1',
        ).exclude(pk=self.pk)
        if self.fecha_fin:
            overlap = overlap.filter(
                Q(fecha_fin__isnull=True, fecha_inicio__lte=self.fecha_fin) |
                Q(fecha_inicio__lte=self.fecha_fin, fecha_fin__gte=self.fecha_inicio)
            )
        else:
            overlap = overlap.filter(
                Q(fecha_fin__isnull=True) | Q(fecha_fin__gte=self.fecha_inicio)
            )
        if overlap.exists():
            raise ValidationError('Existe un período solapado para este cargo.')

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        quien = self.docente or 'Vacante'
        fin = self.fecha_fin or 'vigente'
        return f"{self.cargo_departamento} | {quien} | {self.fecha_inicio} → {fin}"

    class Meta:
        ordering = ['cargo_departamento', '-fecha_inicio']
        verbose_name = 'Historial de Cargo'
        verbose_name_plural = 'Historial de Cargos'
