from django.db import models

from .base import BaseModel


class EstadisticaAsignatura(BaseModel):
    """Matrícula de una asignatura por carrera y año.

    Es el dato que permite contrastar la carga docente contra la demanda real:
    una asignatura con un solo docente y 300 inscriptos es un riesgo distinto
    que una con un docente y 4 inscriptos.
    """

    asignatura = models.ForeignKey(
        'Asignatura', on_delete=models.CASCADE, related_name='estadisticas')
    carrera = models.ForeignKey(
        'Carrera', on_delete=models.CASCADE, related_name='estadisticas')
    anio = models.PositiveSmallIntegerField()
    inscriptos = models.PositiveIntegerField(default=0)
    aprobados = models.PositiveIntegerField(default=0)
    promovidos = models.PositiveIntegerField(default=0)
    observaciones = models.TextField(blank=True, null=True)
    estado = models.CharField(max_length=1, default='1')

    @property
    def tasa_aprobacion(self):
        """(aprobados + promovidos) / inscriptos. None si no hubo inscriptos."""
        if not self.inscriptos:
            return None
        return round((self.aprobados + self.promovidos) / self.inscriptos, 4)

    def __str__(self):
        return f'{self.asignatura} · {self.carrera} · {self.anio}'

    class Meta:
        ordering = ['-anio', 'asignatura']
        verbose_name = 'Estadística de Asignatura'
        verbose_name_plural = 'Estadísticas de Asignaturas'
        constraints = [
            models.UniqueConstraint(
                fields=['asignatura', 'carrera', 'anio'],
                name='unique_estadistica_asig_carrera_anio',
            ),
        ]
