from django.contrib import admin
from ..models import Notificacion

@admin.register(Notificacion)
class NotificacionAdmin(admin.ModelAdmin):
    list_display = ('persona', 'mensaje', 'leido', 'fecha_creacion')
    list_filter = ('leido', 'fecha_creacion')
    search_fields = ('persona__apellido', 'persona__nombre', 'mensaje')
    ordering = ('-fecha_creacion',)
