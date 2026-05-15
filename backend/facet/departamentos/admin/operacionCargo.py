from ..models import OperacionCargo
from django.contrib import admin


@admin.register(OperacionCargo)
class OperacionCargoAdmin(admin.ModelAdmin):
    list_display = ('id', 'tipo', 'fecha', 'estado', '_origenes', '_destinos')
    list_filter = ('tipo', 'estado', 'fecha')
    filter_horizontal = ('cargos_origen', 'cargos_destino')
    raw_id_fields = ('resolucion',)
    list_per_page = 20

    @admin.display(description='Cargos origen')
    def _origenes(self, obj):
        return ', '.join(str(c.numero_de_cargo) for c in obj.cargos_origen.all())

    @admin.display(description='Cargos destino')
    def _destinos(self, obj):
        return ', '.join(str(c.numero_de_cargo) for c in obj.cargos_destino.all())
