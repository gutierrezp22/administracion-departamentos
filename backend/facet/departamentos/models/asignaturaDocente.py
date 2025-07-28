from django.db import models
from .base import BaseModel

class AsignaturaDocente(BaseModel):

    DEDICACION_CHOICES = [
        ('EXCL', 'EXCL'),
        ('SIMP', 'SIMP'),
        ('SEMI', 'SEMI'),
        ('35HS', '35HS'),
    ]

    CONDICION_CHOICES = [
        ('Regular', 'Regular'),
        ('Interino', 'Interino'),
        ('Transitorio', 'Transitorio'),
        ('Licencia sin goce de sueldo', 'Licencia sin goce de sueldo'),
        ('Renuncia', 'Renuncia'),
        ('Licencia con goce de sueldo', 'Licencia con goce de sueldo'),
    ]

    CARGO_CHOICES = [
        ('AUX DOC DE PRIMERA', 'AUX DOC DE PRIMERA'),
        ('AUX DOCENTE SEGUNDA', 'AUX DOCENTE SEGUNDA'),
        ('Categoria 01 Dto.366', 'Categoria 01 Dto.366'),
        ('Categoria 02 Dto.366', 'Categoria 02 Dto.366'),
        ('Categoria 03 Dto.366', 'Categoria 03 Dto.366'),
        ('Categoria 04 Dto.366', 'Categoria 04 Dto.366'),
        ('Categoria 05 Dto.366', 'Categoria 05 Dto.366'),
        ('Categoria 06 Dto.366', 'Categoria 06 Dto.366'),
        ('Categoria 07 Dto.366', 'Categoria 07 Dto.366'),
        ('DECANO FACULTAD', 'DECANO FACULTAD'),
        ('JEFE TRABAJOS PRACT.', 'JEFE TRABAJOS PRACT.'),
        ('PROFESOR ADJUNTO', 'PROFESOR ADJUNTO'),
        ('PROFESOR ASOCIADO', 'PROFESOR ASOCIADO'),
        ('PROFESOR TITULAR', 'PROFESOR TITULAR'),
        ('SECRETARIO FACULTAD', 'SECRETARIO FACULTAD'),
        ('VICE DECANO', 'VICE DECANO'),
    ]

    condicion = models.CharField(max_length=50, choices=CONDICION_CHOICES)
    cargo = models.CharField(max_length=50, choices=CARGO_CHOICES)
    dedicacion = models.CharField(max_length=20, choices=DEDICACION_CHOICES)
    fecha_de_inicio = models.DateTimeField(blank=True, null=True)
    fecha_de_vencimiento = models.DateTimeField(blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)
    estado = models.CharField(max_length=1)
    # ✅ Nuevo campo para saber si se envió la notificación
    notificado = models.BooleanField(default=False)


    asignatura = models.ForeignKey(
        'Asignatura', models.CASCADE)

    docente = models.ForeignKey(
        'Docente', models.CASCADE)
    
    resolucion = models.ForeignKey(
        'Resolucion', models.CASCADE)



    def __str__(self):
        return f"{self.id}"

    class Meta:
        ordering = ['id']
        verbose_name = 'AsignaturaDocente'
        verbose_name_plural = 'AsignaturaDocentes'