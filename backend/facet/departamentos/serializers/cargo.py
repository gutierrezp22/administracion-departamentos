from rest_framework import serializers
from ..models import Cargo


class CargoSerializer(serializers.ModelSerializer):
    puntaje = serializers.DecimalField(
        max_digits=4, decimal_places=2, read_only=True)
    tipo_cargo_detalle = serializers.SerializerMethodField()
    cargo_departamento_detalle = serializers.SerializerMethodField()
    resolucion_oficializacion_detalle = serializers.SerializerMethodField()

    class Meta:
        model = Cargo
        fields = [
            'id', 'numero_de_cargo',
            'tipo_cargo', 'tipo_cargo_detalle',
            'cargo_departamento', 'cargo_departamento_detalle',
            'resolucion_oficializacion', 'resolucion_oficializacion_detalle',
            'puntaje', 'observaciones', 'estado',
            'fecha_creacion', 'fecha_modificacion',
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

    def get_cargo_departamento_detalle(self, obj):
        cd = obj.cargo_departamento
        if not cd:
            return None
        return {
            'id': cd.id,
            'descripcion': cd.descripcion,
            'departamento': {
                'id': cd.departamento_id,
                'nombre': cd.departamento.nombre if cd.departamento else None,
            } if cd.departamento_id else None,
            'asignatura': {
                'id': cd.asignatura_id,
                'nombre': cd.asignatura.nombre if cd.asignatura else None,
                'codigo': cd.asignatura.codigo if cd.asignatura else None,
            } if cd.asignatura_id else None,
        }

    def get_resolucion_oficializacion_detalle(self, obj):
        if not obj.resolucion_oficializacion:
            return None
        r = obj.resolucion_oficializacion
        return {
            'id': r.id,
            'nresolucion': r.nresolucion,
            'nexpediente': r.nexpediente,
            'fecha': r.fecha,
        }
