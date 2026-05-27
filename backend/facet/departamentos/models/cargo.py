from django.db import models
from .base import BaseModel


class Cargo(BaseModel):
    numero_de_cargo = models.PositiveIntegerField(unique=True, verbose_name='Número de cargo')
    tipo_cargo = models.ForeignKey(
        'TipoCargo', on_delete=models.PROTECT, null=True, blank=True,
        related_name='cargos',
        help_text='Tipo de cargo (incluye dedicación). Null si aún no se asignó.')
    cargo_departamento = models.OneToOneField(
        'CargoDepartamento', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='cargo',
        help_text='Slot de departamento al que está vinculado este cargo (plata). 1:1.')
    resolucion_oficializacion = models.ForeignKey(
        'Resolucion', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='cargos_oficializados',
        help_text='Resolución que oficializa la creación / asignación del cargo.')
    observaciones = models.TextField(blank=True, null=True)
    estado = models.CharField(max_length=1, default='1')

    @property
    def puntaje(self):
        """Puntaje del cargo según su TipoCargo. None si no aplica."""
        return self.tipo_cargo.puntaje if self.tipo_cargo else None

    def __str__(self):
        tipo = f' [{self.tipo_cargo}]' if self.tipo_cargo else ''
        return f"Cargo {self.numero_de_cargo}{tipo}"

    class Meta:
        ordering = ['numero_de_cargo']
        verbose_name = 'Cargo'
        verbose_name_plural = 'Cargos'
