from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('departamentos', '0004_alter_asignaturadocente_cargo_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # 1) Renombrar el CharField actual `cargo` a `tipo_cargo` (preserva datos)
        migrations.RenameField(
            model_name='asignaturadocente',
            old_name='cargo',
            new_name='tipo_cargo',
        ),

        # 2) Crear modelo Cargo
        migrations.CreateModel(
            name='Cargo',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('estado', models.CharField(default='1', max_length=1)),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')),
                ('fecha_modificacion', models.DateTimeField(auto_now=True, verbose_name='Fecha de modificación')),
                ('numero_de_cargo', models.PositiveIntegerField(unique=True, verbose_name='Número de cargo')),
                ('observaciones', models.TextField(blank=True, null=True)),
                ('actualizado_por', models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='cargo_updated_by', to=settings.AUTH_USER_MODEL, verbose_name='Actualizado por')),
                ('creado_por', models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='cargo_created_by', to=settings.AUTH_USER_MODEL, verbose_name='Creado por')),
            ],
            options={
                'verbose_name': 'Cargo',
                'verbose_name_plural': 'Cargos',
                'ordering': ['numero_de_cargo'],
            },
        ),

        # 3) Crear modelo CargoHistorial
        migrations.CreateModel(
            name='CargoHistorial',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('estado', models.CharField(default='1', max_length=1)),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')),
                ('fecha_modificacion', models.DateTimeField(auto_now=True, verbose_name='Fecha de modificación')),
                ('fecha_inicio', models.DateField()),
                ('fecha_fin', models.DateField(blank=True, help_text='Si es null el período sigue vigente', null=True)),
                ('motivo_fin', models.CharField(blank=True, choices=[('designacion', 'Designación'), ('vencimiento', 'Vencimiento'), ('renuncia', 'Renuncia'), ('licencia', 'Licencia'), ('baja', 'Baja'), ('vacante', 'Vacante'), ('otro', 'Otro')], max_length=20, null=True)),
                ('observaciones', models.TextField(blank=True, null=True)),
                ('actualizado_por', models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='cargohistorial_updated_by', to=settings.AUTH_USER_MODEL, verbose_name='Actualizado por')),
                ('creado_por', models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='cargohistorial_created_by', to=settings.AUTH_USER_MODEL, verbose_name='Creado por')),
                ('cargo', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='historial', to='departamentos.cargo')),
                ('docente', models.ForeignKey(blank=True, help_text='Si es null el período se considera vacante', null=True, on_delete=django.db.models.deletion.SET_NULL, to='departamentos.docente')),
                ('resolucion', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='departamentos.resolucion')),
            ],
            options={
                'verbose_name': 'Historial de Cargo',
                'verbose_name_plural': 'Historial de Cargos',
                'ordering': ['cargo', '-fecha_inicio'],
            },
        ),

        # 4) Agregar FK `cargo` (nullable) en AsignaturaDocente apuntando a Cargo
        migrations.AddField(
            model_name='asignaturadocente',
            name='cargo',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='asignaciones', to='departamentos.cargo'),
        ),
    ]
