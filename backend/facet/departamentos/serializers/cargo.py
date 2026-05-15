from rest_framework import serializers
from ..models import Cargo


class CargoSerializer(serializers.ModelSerializer):
    ocupacion_actual = serializers.SerializerMethodField()
    puntaje = serializers.DecimalField(
        max_digits=4, decimal_places=2, read_only=True)
    tipo_cargo_detalle = serializers.SerializerMethodField()

    class Meta:
        model = Cargo
        fields = [
            'id', 'numero_de_cargo', 'tipo_cargo', 'tipo_cargo_detalle',
            'puntaje', 'observaciones', 'estado',
            'fecha_creacion', 'fecha_modificacion', 'ocupacion_actual',
        ]

    def get_tipo_cargo_detalle(self, obj):
        if not obj.tipo_cargo:
            return None
        return {
            'id': obj.tipo_cargo.id,
            'sigla': obj.tipo_cargo.sigla,
            'descripcion': obj.tipo_cargo.descripcion,
            'dedicacion': obj.tipo_cargo.dedicacion,
            'puntaje': obj.tipo_cargo.puntaje,
        }

    def get_ocupacion_actual(self, obj):
        """Devuelve el período vigente (fecha_fin null y estado activo) si existe."""
        actual = obj.historial.filter(fecha_fin__isnull=True, estado='1').order_by('-fecha_inicio').first()
        if not actual:
            return None
        return {
            'id': actual.id,
            'fecha_inicio': actual.fecha_inicio,
            'docente': {
                'id': actual.docente.id,
                'nombre': actual.docente.persona.nombre,
                'apellido': actual.docente.persona.apellido,
                'dni': actual.docente.persona.dni,
            } if actual.docente else None,
            'vacante': actual.docente is None,
        }
