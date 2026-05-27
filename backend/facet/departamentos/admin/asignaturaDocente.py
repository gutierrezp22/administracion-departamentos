from ..models import AsignaturaDocente
from django.contrib import admin
from django.contrib.auth import get_user_model
User = get_user_model()

@admin.register(AsignaturaDocente)
class AsignaturaDocenteAdmin(admin.ModelAdmin):
    list_display = ('condicion','tipo_cargo','cargo_departamento','estado',)
    list_filter = ('condicion','tipo_cargo','estado')
    list_per_page = 15
