from rest_framework import serializers
from ..models import Notificacion

class NotificacionSerializer(serializers.ModelSerializer):
    persona_nombre = serializers.CharField(source="persona.nombre", read_only=True)
    persona_apellido = serializers.CharField(source="persona.apellido", read_only=True)

    class Meta:
        model = Notificacion
        fields = ['id', 'persona', 'persona_nombre', 'persona_apellido', 'mensaje', 'leido', 'fecha_creacion']
