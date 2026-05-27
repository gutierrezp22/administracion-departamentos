from ..models import CargoHistorial
from django.contrib import admin


@admin.register(CargoHistorial)
class CargoHistorialAdmin(admin.ModelAdmin):
    list_display = ('cargo_departamento', 'docente', 'fecha_inicio', 'fecha_fin', 'motivo_fin', 'estado')
    list_filter = ('motivo_fin', 'estado')
    search_fields = ('cargo_departamento__descripcion', 'docente__persona__apellido', 'docente__persona__nombre')
    list_per_page = 15
    raw_id_fields = ('cargo_departamento', 'docente', 'resolucion')
