from rest_framework import serializers

from ..models import AsignacionFuncion


class AsignacionFuncionSerializer(serializers.ModelSerializer):
    docente_detalle = serializers.SerializerMethodField()
    area_detalle = serializers.SerializerMethodField()
    departamento_detalle = serializers.SerializerMethodField()

    class Meta:
        model = AsignacionFuncion
        fields = [
            'id', 'docente', 'docente_detalle', 'descripcion',
            'departamento', 'departamento_detalle',
            'area', 'area_detalle',
            'resolucion', 'expediente',
            'fecha_desde', 'fecha_hasta',
            'observaciones', 'estado',
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
        }

    def get_area_detalle(self, obj):
        if not obj.area:
            return None
        return {'id': obj.area.id, 'nombre': obj.area.nombre}

    def get_departamento_detalle(self, obj):
        if not obj.departamento:
            return None
        return {'id': obj.departamento.id, 'nombre': obj.departamento.nombre}

    def validate(self, attrs):
        instancia = self.instance
        desde = attrs.get('fecha_desde', getattr(instancia, 'fecha_desde', None))
        hasta = attrs.get('fecha_hasta', getattr(instancia, 'fecha_hasta', None))
        if desde and hasta and hasta < desde:
            raise serializers.ValidationError({
                'fecha_hasta': 'La fecha de fin no puede ser anterior al inicio.',
            })
        return attrs
