from rest_framework import serializers

from ..models import Seguimiento


class SeguimientoSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_seguimiento_display = serializers.CharField(
        source='get_estado_seguimiento_display', read_only=True)
    prioridad_display = serializers.CharField(
        source='get_prioridad_display', read_only=True)
    abierto = serializers.BooleanField(read_only=True)
    docente_detalle = serializers.SerializerMethodField()

    class Meta:
        model = Seguimiento
        fields = [
            'id', 'docente', 'docente_detalle',
            'tipo', 'tipo_display', 'descripcion',
            'fecha_novedad', 'fecha_resolucion', 'responsable',
            'prioridad', 'prioridad_display',
            'estado_seguimiento', 'estado_seguimiento_display', 'abierto',
            'designacion', 'observaciones', 'estado',
            'fecha_creacion', 'fecha_modificacion',
        ]
        read_only_fields = ['fecha_creacion', 'fecha_modificacion']

    def get_docente_detalle(self, obj):
        if not obj.docente_id:
            return None
        p = obj.docente.persona
        return {
            'id': obj.docente.id,
            'nombre': p.nombre,
            'apellido': p.apellido,
            'dni': p.dni,
            'legajo': p.legajo,
            'email': p.email,
        }

    def validate(self, attrs):
        instancia = self.instance
        estado_seg = attrs.get(
            'estado_seguimiento', getattr(instancia, 'estado_seguimiento', 'pendiente'))
        fecha_res = attrs.get(
            'fecha_resolucion', getattr(instancia, 'fecha_resolucion', None))
        if estado_seg == 'resuelto' and not fecha_res:
            raise serializers.ValidationError({
                'fecha_resolucion': 'Un seguimiento resuelto necesita fecha de resolución.',
            })
        return attrs
