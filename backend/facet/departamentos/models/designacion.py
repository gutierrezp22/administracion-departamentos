from django.core.exceptions import ValidationError
from django.db import models

from .base import BaseModel


class Designacion(BaseModel):
    """Evento de designación de un docente en un cargo.

    Es la unidad de información que hoy vive como texto libre en las columnas
    CON / EA / DI_GENUINO / DI_NO_GENUINO / Prórroga de la planilla de planta.
    Cada bloque de esas columnas es una Designacion: un tipo de trámite, un
    código de cargo, un expediente, una resolución y un rango de fechas.

    La ocupación de un cargo (quién lo tiene hoy, hasta cuándo, si está
    vencido) NO se guarda: se deriva de la secuencia de designaciones sobre el
    mismo `codigo_cargo`. Ver `apis/reportePlanta.py`.
    """

    # ---- tipos de trámite -------------------------------------------------
    CON = 'CON'
    CON_INTERINO = 'CON_INTERINO'
    DI_GENUINO = 'DI_GENUINO'
    DI_NO_GENUINO = 'DI_NO_GENUINO'
    EA_POSITIVA = 'EA_POSITIVA'
    EA_NEGATIVA = 'EA_NEGATIVA'
    PRORROGA_DI_GENUINO = 'PRORROGA_DI_GENUINO'
    PRORROGA_DI_NO_GENUINO = 'PRORROGA_DI_NO_GENUINO'
    PROR_70_ANIOS = 'PROR_70_ANIOS'
    PROR_CARGO_GESTION = 'PROR_CARGO_GESTION'
    RENUNCIA = 'RENUNCIA'
    REINTEGRO = 'REINTEGRO'
    ALTA = 'ALTA'
    BAJA = 'BAJA'

    TIPO_CHOICES = [
        (CON, 'Concurso'),
        (CON_INTERINO, 'Concurso interino'),
        (DI_GENUINO, 'Designación interina genuina'),
        (DI_NO_GENUINO, 'Designación interina no genuina'),
        (EA_POSITIVA, 'Evaluación académica positiva'),
        (EA_NEGATIVA, 'Evaluación académica negativa'),
        (PRORROGA_DI_GENUINO, 'Prórroga de DI genuina'),
        (PRORROGA_DI_NO_GENUINO, 'Prórroga de DI no genuina'),
        (PROR_70_ANIOS, 'Prórroga 70 años'),
        (PROR_CARGO_GESTION, 'Prórroga por cargo de gestión'),
        (RENUNCIA, 'Renuncia'),
        (REINTEGRO, 'Reintegro'),
        (ALTA, 'Alta de cargo'),
        (BAJA, 'Baja de cargo'),
    ]

    # Duración en años que otorga cada tipo de trámite. None = sin vencimiento
    # propio (el vencimiento sale de la fecha explícita o de la edad).
    DURACIONES = {
        CON: 5,
        CON_INTERINO: 1,
        DI_GENUINO: 1,
        DI_NO_GENUINO: 1,
        EA_POSITIVA: 5,
        EA_NEGATIVA: 3,
        PRORROGA_DI_GENUINO: 1,
        PRORROGA_DI_NO_GENUINO: 1,
        PROR_70_ANIOS: None,
        PROR_CARGO_GESTION: None,
        RENUNCIA: 0,
        REINTEGRO: 0,
        ALTA: None,
        BAJA: 0,
    }

    # Tipos que cierran la ocupación del cargo.
    TIPOS_CIERRE = {RENUNCIA, BAJA}

    TIPO_INSTRUMENTO_CHOICES = [
        ('Res_Rec', 'Resolución Rectoral'),
        ('Res_Dec', 'Resolución Decanal'),
        ('Res_CD', 'Resolución de Consejo Directivo'),
        ('DGPRES', 'Disposición DGPRES'),
        ('Expte', 'Sólo expediente'),
        ('Sin_instrumento', 'Sin instrumento'),
    ]

    # ---- campos -----------------------------------------------------------
    docente = models.ForeignKey(
        'Docente', on_delete=models.CASCADE, related_name='designaciones')
    tipo = models.CharField(max_length=25, choices=TIPO_CHOICES)

    cargo_departamento = models.ForeignKey(
        'CargoDepartamento', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='designaciones',
        help_text='Cargo de departamento afectado (opcional mientras no esté vinculado).')
    tipo_cargo = models.ForeignKey(
        'TipoCargo', on_delete=models.PROTECT, null=True, blank=True,
        related_name='designaciones',
        help_text='Tipo de cargo designado. Define rango, dedicación y horas.')
    codigo_cargo = models.PositiveIntegerField(
        null=True, blank=True,
        help_text='Código UNT del cargo (705, 716…). Se autocompleta desde tipo_cargo. '
                  'Es la clave por la que se agrupan las designaciones en una ocupación.')

    asignatura = models.ForeignKey(
        'Asignatura', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='designaciones')
    area = models.ForeignKey(
        'Area', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='designaciones')

    # instrumento legal
    resolucion = models.ForeignKey(
        'Resolucion', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='designaciones')
    tipo_instrumento = models.CharField(
        max_length=20, choices=TIPO_INSTRUMENTO_CHOICES, blank=True, null=True)
    expediente = models.CharField(
        max_length=100, blank=True, null=True,
        help_text='Nº de expediente, ej. "3229/2024".')
    nro_resolucion = models.CharField(
        max_length=100, blank=True, null=True,
        help_text='Nº de resolución cuando todavía no se cargó la Resolución completa.')
    dgpres = models.CharField(
        max_length=100, blank=True, null=True,
        help_text='Disposición presupuestaria que habilita el gasto, ej. "DGPRES 1374/2024".')

    # vigencia
    fecha_desde = models.DateField(null=True, blank=True)
    fecha_hasta = models.DateField(
        null=True, blank=True,
        help_text='Vencimiento explícito. Si está vacío se estima según el tipo de trámite.')

    en_tramite = models.BooleanField(
        default=False,
        help_text='La designación está iniciada pero sin instrumento firme.')
    renuncia_definitiva = models.BooleanField(
        default=False,
        help_text='Sólo para RENUNCIA: distingue la renuncia definitiva de la condicionada.')
    rol_gestion = models.CharField(
        max_length=100, blank=True, null=True,
        help_text='Cargo de gestión que motiva la prórroga (Decano, Secretario…).')

    texto_original = models.TextField(
        blank=True, null=True,
        help_text='Texto tal como venía en la planilla, para trazabilidad de la migración.')
    observaciones = models.TextField(blank=True, null=True)
    estado = models.CharField(max_length=1, default='1')

    # ---- lógica -----------------------------------------------------------
    @property
    def duracion_anios(self):
        """Años de vigencia que otorga el tipo de trámite. None si no aplica."""
        return self.DURACIONES.get(self.tipo)

    @property
    def cierra_cargo(self):
        return self.tipo in self.TIPOS_CIERRE

    def vencimiento_estimado(self):
        """Vencimiento derivado: fecha explícita, o fecha_desde + duración del tipo.

        Devuelve (fecha, fuente). `fuente` describe de dónde salió la fecha,
        para que el reporte marque con "≈" las que son estimadas.
        """
        if self.fecha_hasta:
            return self.fecha_hasta, f'{self.tipo} (fecha explícita)'
        dur = self.duracion_anios
        if dur is None or not self.fecha_desde:
            return None, None
        d = self.fecha_desde
        try:
            fin = d.replace(year=d.year + dur)
        except ValueError:  # 29 de febrero en año no bisiesto
            fin = d.replace(year=d.year + dur, day=28)
        return fin, f'{self.tipo}+{dur}a'

    def clean(self):
        super().clean()
        if self.fecha_hasta and self.fecha_desde and self.fecha_hasta < self.fecha_desde:
            raise ValidationError({
                'fecha_hasta': 'La fecha de vencimiento no puede ser anterior al inicio.',
            })
        if self.tipo == self.PROR_CARGO_GESTION and not self.rol_gestion:
            raise ValidationError({
                'rol_gestion': 'Indicá el cargo de gestión que motiva la prórroga.',
            })
        if self.renuncia_definitiva and self.tipo != self.RENUNCIA:
            raise ValidationError({
                'renuncia_definitiva': 'Sólo aplica a designaciones de tipo RENUNCIA.',
            })

    def save(self, *args, **kwargs):
        # El código de cargo sale del tipo de cargo si no vino explícito.
        if not self.codigo_cargo and self.tipo_cargo_id:
            self.codigo_cargo = self.tipo_cargo.codigo
        super().save(*args, **kwargs)

    def __str__(self):
        quien = self.docente.persona.apellido if self.docente_id else '—'
        cod = f' #{self.codigo_cargo}' if self.codigo_cargo else ''
        return f'{self.get_tipo_display()}{cod} · {quien} ({self.fecha_desde or "s/f"})'

    class Meta:
        ordering = ['-fecha_desde', '-id']
        verbose_name = 'Designación'
        verbose_name_plural = 'Designaciones'
        indexes = [
            models.Index(fields=['docente', 'codigo_cargo']),
            models.Index(fields=['tipo']),
            models.Index(fields=['fecha_desde']),
        ]
