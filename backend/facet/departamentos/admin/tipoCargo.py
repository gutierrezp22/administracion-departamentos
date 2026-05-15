from ..models import TipoCargo
from django.contrib import admin


@admin.register(TipoCargo)
class TipoCargoAdmin(admin.ModelAdmin):
    list_display = ('sigla', 'descripcion', 'dedicacion', 'puntaje', 'estado')
    list_filter = ('dedicacion', 'estado', 'sigla')
    search_fields = ('sigla', 'descripcion')
    list_per_page = 25
    ordering = ('descripcion', 'dedicacion')
