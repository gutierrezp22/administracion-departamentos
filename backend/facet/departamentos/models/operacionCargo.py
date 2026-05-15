from decimal import Decimal
from django.core.exceptions import ValidationError
from django.db import models
from .base import BaseModel


class OperacionCargo(BaseModel):
    """Registra descomposiciones, combinaciones y renovaciones de cargos.

    - Descomposición: 1 origen → N destinos.
    - Combinación: N orígenes → 1 destino.
    - Renovación: 1 origen → 1 destino (vencimiento con nuevo número).

    La validación de puntaje se hace en el endpoint (no aquí) porque los M2M
    aún no están persistidos en clean().
    """

    TIPO_CHOICES = [
        ('descomposicion', 'Descomposición'),
        ('combinacion', 'Combinación'),
        ('renovacion', 'Renovación'),
    ]

    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    fecha = models.DateField()
    cargos_origen = models.ManyToManyField(
        'Cargo', related_name='operaciones_como_origen')
    cargos_destino = models.ManyToManyField(
        'Cargo', related_name='operaciones_como_destino')
    resolucion = models.ForeignKey(
        'Resolucion', on_delete=models.SET_NULL, null=True, blank=True)
    observaciones = models.TextField(blank=True, null=True)
    estado = models.CharField(max_length=1, default='1')

    def puntaje_origen(self):
        """Suma de puntajes de cargos_origen (None si alguno no tiene puntaje)."""
        cargos = list(self.cargos_origen.select_related('tipo_cargo').all())
        if not cargos:
            return None
        total = Decimal('0')
        for c in cargos:
            if c.puntaje is None:
                return None
            total += c.puntaje
        return total

    def puntaje_destino(self):
        """Suma de puntajes de cargos_destino (None si alguno no tiene puntaje)."""
        cargos = list(self.cargos_destino.select_related('tipo_cargo').all())
        if not cargos:
            return None
        total = Decimal('0')
        for c in cargos:
            if c.puntaje is None:
                return None
            total += c.puntaje
        return total

    def __str__(self):
        return f"{self.get_tipo_display()} ({self.fecha})"

    class Meta:
        ordering = ['-fecha', '-id']
        verbose_name = 'Operación de Cargo'
        verbose_name_plural = 'Operaciones de Cargo'
