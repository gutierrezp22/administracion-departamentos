# Generated manually 2026-05-26
# Migra CargoHistorial.cargo (FK Cargo) y OperacionCargo.cargos_origen/destino
# (M2M Cargo) para que apunten a CargoDepartamento.
#
# Asume que los datos existentes ya fueron limpiados (los registros que
# apuntaban a Cargo eran del Excel y se van a recargar con la nueva semántica).

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('departamentos', '0011_split_cargo_cargodepartamento'),
    ]

    operations = [
        # ---- CargoHistorial: cargo (FK Cargo) -> cargo_departamento (FK CargoDepartamento)
        migrations.RemoveField(
            model_name='cargohistorial',
            name='cargo',
        ),
        migrations.AddField(
            model_name='cargohistorial',
            name='cargo_departamento',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='historial',
                to='departamentos.cargodepartamento',
            ),
            preserve_default=False,
        ),
        migrations.AlterModelOptions(
            name='cargohistorial',
            options={
                'ordering': ['cargo_departamento', '-fecha_inicio'],
                'verbose_name': 'Historial de Cargo',
                'verbose_name_plural': 'Historial de Cargos',
            },
        ),

        # ---- OperacionCargo.cargos_origen / cargos_destino: M2M Cargo -> M2M CargoDepartamento
        migrations.RemoveField(
            model_name='operacioncargo',
            name='cargos_origen',
        ),
        migrations.RemoveField(
            model_name='operacioncargo',
            name='cargos_destino',
        ),
        migrations.AddField(
            model_name='operacioncargo',
            name='cargos_origen',
            field=models.ManyToManyField(
                related_name='operaciones_como_origen',
                to='departamentos.cargodepartamento',
            ),
        ),
        migrations.AddField(
            model_name='operacioncargo',
            name='cargos_destino',
            field=models.ManyToManyField(
                related_name='operaciones_como_destino',
                to='departamentos.cargodepartamento',
            ),
        ),
    ]
