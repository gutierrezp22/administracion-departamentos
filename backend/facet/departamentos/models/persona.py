from django.db import models
from .base import BaseModel 
from .tipoTitulo import TipoTitulo

class Persona(BaseModel):
    SEXO_CHOICES = [
        ('M', 'Masculino'),
        ('F', 'Femenino'),
        ('X', 'Otro / No informa'),
    ]
    ESTADO_AGENTE_CHOICES = [
        ('activo', 'Activo'),
        ('licencia', 'En licencia'),
        ('jubilado', 'Jubilado'),
        ('renuncia', 'Renunció'),
        ('inactivo', 'Inactivo'),
    ]

    nombre = models.CharField(blank=False, null=False)
    apellido = models.CharField( blank=False, null=False)
    telefono = models.CharField(blank=True, null=True)
    dni = models.CharField(blank=False, null=False)
    cuil = models.CharField(
        max_length=13, blank=True, null=True,
        help_text='CUIL sin guiones. Es la clave de cruce con liquidaciones y SIU.')
    estado = models.CharField(max_length=1)
    estado_agente = models.CharField(
        max_length=10, choices=ESTADO_AGENTE_CHOICES, default='activo',
        help_text='Situación de revista del agente (distinto de `estado`, que es el borrado lógico).')
    sexo = models.CharField(
        max_length=1, choices=SEXO_CHOICES, blank=True, null=True)
    email = models.CharField(blank=True, null=True)
    interno = models.IntegerField(blank=True, null=True)
    legajo = models.CharField(blank=True, null=True)
    titulo = models.ForeignKey(TipoTitulo, on_delete=models.SET_NULL, null=True, blank=True)
    fecha_nacimiento = models.DateField(blank=True, null=True, help_text="Fecha de nacimiento para cálculo de jubilación")
    fecha_ingreso = models.DateField(
        blank=True, null=True,
        help_text='Fecha de ingreso a la Universidad, para calcular antigüedad.')
    acoop = models.BooleanField(
        default=False, verbose_name='Aporta a ACOOP')
    observaciones = models.TextField(blank=True, null=True)

    @property
    def edad(self):
        """Edad en años cumplidos a la fecha de hoy. None si no hay fecha de nacimiento."""
        if not self.fecha_nacimiento:
            return None
        from datetime import date
        hoy = date.today()
        fn = self.fecha_nacimiento
        return hoy.year - fn.year - ((hoy.month, hoy.day) < (fn.month, fn.day))

    @property
    def antiguedad(self):
        """Años desde el ingreso. None si no hay fecha de ingreso."""
        if not self.fecha_ingreso:
            return None
        from datetime import date
        hoy = date.today()
        fi = self.fecha_ingreso
        return hoy.year - fi.year - ((hoy.month, hoy.day) < (fi.month, fi.day))

    def __str__(self):
        return f"{self.apellido,self.nombre}"

    class Meta:
        ordering = ['apellido','nombre']
        verbose_name = 'Persona'
        verbose_name_plural = 'Personas'
        constraints = [
            models.UniqueConstraint(
                fields=['dni'], name='ux_dni_personas'),
        ]
