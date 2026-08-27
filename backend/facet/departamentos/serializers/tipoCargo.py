from rest_framework import serializers
from ..models import TipoCargo


class TipoCargoSerializer(serializers.ModelSerializer):
    dedicacion_display = serializers.CharField(source='get_dedicacion_display', read_only=True)
    rango_display = serializers.CharField(source='get_rango_display', read_only=True)
    denominacion = serializers.CharField(read_only=True)

    class Meta:
        model = TipoCargo
        fields = [
            'id', 'codigo', 'sigla', 'descripcion',
            'dedicacion', 'dedicacion_display',
            'rango', 'rango_display', 'denominacion',
            'horas_semanales', 'puntaje', 'observaciones', 'estado',
        ]
