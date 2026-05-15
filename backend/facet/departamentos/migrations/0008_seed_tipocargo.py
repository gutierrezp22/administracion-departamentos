from decimal import Decimal
from django.db import migrations


# Tipos con puntaje (de la "Tabla de Cargos Docentes"). Tupla:
# (sigla, descripcion, dedicacion, puntaje)
TIPOS_CON_PUNTAJE = [
    ('ADG', 'AUX DOC DE PRIMERA',   'SIMP', Decimal('1.0')),
    ('ADG', 'AUX DOC DE PRIMERA',   'SEMI', Decimal('2.0')),
    ('ADG', 'AUX DOC DE PRIMERA',   'EXCL', Decimal('4.0')),
    ('JTP', 'JEFE TRABAJOS PRACT.', 'SIMP', Decimal('1.2')),
    ('JTP', 'JEFE TRABAJOS PRACT.', 'SEMI', Decimal('2.4')),
    ('JTP', 'JEFE TRABAJOS PRACT.', 'EXCL', Decimal('4.8')),
    ('ADJ', 'PROFESOR ADJUNTO',     'SIMP', Decimal('1.4')),
    ('ADJ', 'PROFESOR ADJUNTO',     'SEMI', Decimal('2.8')),
    ('ADJ', 'PROFESOR ADJUNTO',     'EXCL', Decimal('5.6')),
    ('ASO', 'PROFESOR ASOCIADO',    'SIMP', Decimal('1.6')),
    ('ASO', 'PROFESOR ASOCIADO',    'SEMI', Decimal('3.2')),
    ('ASO', 'PROFESOR ASOCIADO',    'EXCL', Decimal('6.4')),
    ('TIT', 'PROFESOR TITULAR',     'SIMP', Decimal('1.8')),
    ('TIT', 'PROFESOR TITULAR',     'SEMI', Decimal('3.6')),
    ('TIT', 'PROFESOR TITULAR',     'EXCL', Decimal('7.2')),
]

# Tipos existentes en el sistema pero sin equivalencia de puntaje.
TIPOS_SIN_PUNTAJE = [
    ('AUX DOCENTE SEGUNDA', 'SIMP'),
    ('Categoria 02 Dto.366', '35HS'),
    ('Categoria 03 Dto.366', '35HS'),
    ('Categoria 04 Dto.366', '35HS'),
    ('Categoria 05 Dto.366', '35HS'),
    ('Categoria 06 Dto.366', '35HS'),
    ('Categoria 07 Dto.366', '35HS'),
    ('DECANO FACULTAD',     'EXCL'),
    ('VICE DECANO',         'EXCL'),
    ('SECRETARIO FACULTAD', 'EXCL'),
]


def seed_tipocargo(apps, schema_editor):
    TipoCargo = apps.get_model('departamentos', 'TipoCargo')
    for sigla, descripcion, dedicacion, puntaje in TIPOS_CON_PUNTAJE:
        TipoCargo.objects.update_or_create(
            descripcion=descripcion,
            dedicacion=dedicacion,
            defaults={'sigla': sigla, 'puntaje': puntaje, 'estado': '1'},
        )
    for descripcion, dedicacion in TIPOS_SIN_PUNTAJE:
        TipoCargo.objects.update_or_create(
            descripcion=descripcion,
            dedicacion=dedicacion,
            defaults={'sigla': '', 'puntaje': None, 'estado': '1'},
        )


def unseed_tipocargo(apps, schema_editor):
    TipoCargo = apps.get_model('departamentos', 'TipoCargo')
    descripciones = (
        [d for _, d, _, _ in TIPOS_CON_PUNTAJE] +
        [d for d, _ in TIPOS_SIN_PUNTAJE]
    )
    TipoCargo.objects.filter(descripcion__in=descripciones).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('departamentos', '0007_tipocargo_operacioncargo'),
    ]

    operations = [
        migrations.RunPython(seed_tipocargo, reverse_code=unseed_tipocargo),
    ]
