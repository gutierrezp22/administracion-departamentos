from django.core.exceptions import ValidationError
from django.db import models
from .base import BaseModel


class CargoDepartamento(BaseModel):
    """Cargo definido por un departamento.

    Es el cargo lógico que vive dentro de un departamento, opcionalmente
    asociado a una asignatura del propio departamento. Un Cargo (plata,
    payroll) se vincula a este Cargo de Departamento 1:1 vía
    `Cargo.cargo_departamento`.
    """

    departamento = models.ForeignKey(
        'Departamento', on_delete=models.PROTECT,
        related_name='cargos_departamento',
        help_text='Departamento dueño del cargo.')
    asignatura = models.ForeignKey(
        'Asignatura', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='cargos_departamento',
        help_text='Asignatura vinculada (opcional). Debe pertenecer al mismo departamento.')
    tipo_cargo = models.ForeignKey(
        'TipoCargo', on_delete=models.PROTECT, null=True, blank=True,
        related_name='cargos_departamento',
        help_text='Tipo de cargo (PROFESOR TITULAR/SIMP, etc.).')
    descripcion = models.CharField(
        max_length=200, blank=True,
        help_text='Nombre interno del cargo (ej. "Auxiliar de Análisis II").')
    observaciones = models.TextField(blank=True, null=True)
    estado = models.CharField(max_length=1, default='1')

    def clean(self):
        super().clean()
        if self.asignatura and self.asignatura.departamento_id != self.departamento_id:
            raise ValidationError({
                'asignatura': 'La asignatura debe pertenecer al mismo departamento.',
            })

    @property
    def puntaje(self):
        """Puntaje del Cargo de Departamento según su TipoCargo. None si no aplica."""
        return self.tipo_cargo.puntaje if self.tipo_cargo else None

    def __str__(self):
        partes = [self.descripcion or f'Cargo de Departamento #{self.pk}']
        if self.tipo_cargo:
            partes.append(f'[{self.tipo_cargo}]')
        partes.append(f'· {self.departamento}')
        return ' '.join(partes)

    class Meta:
        ordering = ['departamento', 'descripcion']
        verbose_name = 'Cargo de Departamento'
        verbose_name_plural = 'Cargos de Departamento'
