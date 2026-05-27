from ..models import CargoDepartamento
from django.contrib import admin


@admin.register(CargoDepartamento)
class CargoDepartamentoAdmin(admin.ModelAdmin):
    list_display = ('descripcion', 'departamento', 'asignatura', 'tipo_cargo', 'estado')
    list_filter = ('departamento', 'estado')
    search_fields = ('descripcion', 'departamento__nombre', 'asignatura__nombre')
    list_per_page = 15
    autocomplete_fields = ()
