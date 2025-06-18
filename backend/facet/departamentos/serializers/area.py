from rest_framework import serializers
from ..models import Area, Departamento

class AreaSerializer(serializers.ModelSerializer):
    # Agregamos el ID de departamento para escritura y un campo adicional para mostrar los datos completos
    departamento = serializers.PrimaryKeyRelatedField(queryset=Departamento.objects.all())
    departamento_detalle = serializers.SerializerMethodField()

    class Meta:
        model = Area
        fields = '__all__'  # Incluye todos los campos, incluyendo departamento y departamento_detalle

    def get_departamento_detalle(self, obj):
        """Obtiene los detalles completos del departamento relacionado"""
        if obj.departamento:
            return {
                "id": obj.departamento.id,
                "nombre": obj.departamento.nombre,
            }
        return None
