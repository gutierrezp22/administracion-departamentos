from rest_framework import serializers
from ..models import TipoCargo


class TipoCargoSerializer(serializers.ModelSerializer):
    dedicacion_display = serializers.CharField(source='get_dedicacion_display', read_only=True)

    class Meta:
        model = TipoCargo
        fields = [
            'id', 'sigla', 'descripcion', 'dedicacion', 'dedicacion_display',
            'puntaje', 'observaciones', 'estado',
        ]
