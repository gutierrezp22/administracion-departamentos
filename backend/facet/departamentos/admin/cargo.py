from ..models import Cargo
from django.contrib import admin


@admin.register(Cargo)
class CargoAdmin(admin.ModelAdmin):
    list_display = ('numero_de_cargo', 'estado', 'fecha_creacion')
    list_filter = ('estado',)
    search_fields = ('numero_de_cargo',)
    list_per_page = 15
