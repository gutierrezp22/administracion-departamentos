# Completa el catálogo de TipoCargo con el código oficial UNT, las horas
# semanales y el rango normalizado. Los códigos salen de la hoja "Cargos" de la
# planilla de Planta Docente del DEEC.

from django.db import migrations


# (descripcion, dedicacion) -> (codigo, rango)
CODIGOS = {
    ('PROFESOR TITULAR', 'EXCL'): (705, 'TITULAR'),
    ('PROFESOR TITULAR', 'SEMI'): (707, 'TITULAR'),
    ('PROFESOR TITULAR', 'SIMP'): (728, 'TITULAR'),
    ('PROFESOR ASOCIADO', 'EXCL'): (706, 'ASOCIADO'),
    ('PROFESOR ASOCIADO', 'SEMI'): (719, 'ASOCIADO'),
    ('PROFESOR ASOCIADO', 'SIMP'): (730, 'ASOCIADO'),
    ('PROFESOR ADJUNTO', 'EXCL'): (709, 'ADJUNTO'),
    ('PROFESOR ADJUNTO', 'SEMI'): (716, 'ADJUNTO'),
    ('PROFESOR ADJUNTO', 'SIMP'): (737, 'ADJUNTO'),
    ('JEFE TRABAJOS PRACT.', 'EXCL'): (734, 'JTP'),
    ('JEFE TRABAJOS PRACT.', 'SEMI'): (757, 'JTP'),
    ('JEFE TRABAJOS PRACT.', 'SIMP'): (758, 'JTP'),
    ('AUX DOC DE PRIMERA', 'EXCL'): (739, 'ADG'),
    ('AUX DOC DE PRIMERA', 'SEMI'): (740, 'ADG'),
    ('AUX DOC DE PRIMERA', 'SIMP'): (741, 'ADG'),
    ('AUX DOCENTE SEGUNDA', 'SIMP'): (768, 'AUX2'),
}

HORAS = {'EXCL': 40, 'SEMI': 20, 'SIMP': 10, '35HS': 35}

# Tipos sin código de cargo docente, pero que igual necesitan rango para que el
# reporte los agrupe en algún lado.
RANGO_SIN_CODIGO = {
    'DECANO FACULTAD': 'GESTION',
    'VICE DECANO': 'GESTION',
    'SECRETARIO FACULTAD': 'GESTION',
}


def seed(apps, schema_editor):
    TipoCargo = apps.get_model('departamentos', 'TipoCargo')

    for tc in TipoCargo.objects.all():
        clave = (tc.descripcion, tc.dedicacion)
        cambios = False

        if clave in CODIGOS:
            codigo, rango = CODIGOS[clave]
            if tc.codigo != codigo:
                tc.codigo = codigo
                cambios = True
            if tc.rango != rango:
                tc.rango = rango
                cambios = True
        elif tc.descripcion in RANGO_SIN_CODIGO:
            if tc.rango != RANGO_SIN_CODIGO[tc.descripcion]:
                tc.rango = RANGO_SIN_CODIGO[tc.descripcion]
                cambios = True
        elif tc.descripcion.startswith('Categoria '):
            if tc.rango != 'NODOCENTE':
                tc.rango = 'NODOCENTE'
                cambios = True

        horas = HORAS.get(tc.dedicacion)
        if horas and tc.horas_semanales != horas:
            tc.horas_semanales = horas
            cambios = True

        if cambios:
            tc.save(update_fields=['codigo', 'rango', 'horas_semanales'])


def unseed(apps, schema_editor):
    TipoCargo = apps.get_model('departamentos', 'TipoCargo')
    TipoCargo.objects.update(codigo=None, rango=None, horas_semanales=None)


class Migration(migrations.Migration):

    dependencies = [
        ('departamentos', '0013_asignatura_codigo_siu_asignatura_conciliada_siu_and_more'),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
