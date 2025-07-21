# Generated manually for adding fecha_nacimiento field
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('departamentos', '0002_remove_area_ux_nombre_area_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='persona',
            name='fecha_nacimiento',
            field=models.DateField(blank=True, null=True, help_text='Fecha de nacimiento para cálculo de jubilación'),
        ),
    ]