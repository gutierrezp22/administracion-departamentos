from rest_framework import serializers
from ..models import Asignatura, Area, Departamento

class AsignaturaSerializer(serializers.ModelSerializer):
    # Agregamos los IDs para escritura y campos adicionales para mostrar los datos completos
    area = serializers.PrimaryKeyRelatedField(queryset=Area.objects.all())
    departamento = serializers.PrimaryKeyRelatedField(queryset=Departamento.objects.all())
    area_detalle = serializers.SerializerMethodField()
    departamento_detalle = serializers.SerializerMethodField()

    class Meta:
        model = Asignatura
        fields = '__all__'  # Incluye todos los campos, incluyendo los detalles

    def get_area_detalle(self, obj):
        """Obtiene los detalles completos del área relacionada"""
        if obj.area:
            return {
                "id": obj.area.id,
                "nombre": obj.area.nombre,
            }
        return None

    def get_departamento_detalle(self, obj):
        """Obtiene los detalles completos del departamento relacionado"""
        if obj.departamento:
            return {
                "id": obj.departamento.id,
                "nombre": obj.departamento.nombre,
            }
        return None
