from rest_framework import serializers
from ..models import OperacionCargo, CargoDepartamento


class CargoMiniSerializer(serializers.ModelSerializer):
    """Serializer compacto para listar Cargos de Departamento dentro de una operación."""
    tipo_cargo_descripcion = serializers.CharField(
        source='tipo_cargo.descripcion', read_only=True)
    tipo_cargo_dedicacion = serializers.CharField(
        source='tipo_cargo.dedicacion', read_only=True)
    departamento_nombre = serializers.CharField(
        source='departamento.nombre', read_only=True)
    puntaje = serializers.DecimalField(
        max_digits=4, decimal_places=2, read_only=True)
    cargo_plata = serializers.SerializerMethodField()

    class Meta:
        model = CargoDepartamento
        fields = [
            'id', 'descripcion', 'departamento_nombre',
            'tipo_cargo', 'tipo_cargo_descripcion', 'tipo_cargo_dedicacion',
            'puntaje', 'estado', 'cargo_plata',
        ]

    def get_cargo_plata(self, obj):
        c = getattr(obj, 'cargo', None)
        if not c:
            return None
        return {'id': c.id, 'numero_de_cargo': c.numero_de_cargo}


class OperacionCargoSerializer(serializers.ModelSerializer):
    """Serializer de lectura con Cargos de Departamento expandidos."""
    cargos_origen = CargoMiniSerializer(many=True, read_only=True)
    cargos_destino = CargoMiniSerializer(many=True, read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    puntaje_origen = serializers.DecimalField(
        max_digits=6, decimal_places=2, read_only=True)
    puntaje_destino = serializers.DecimalField(
        max_digits=6, decimal_places=2, read_only=True)

    class Meta:
        model = OperacionCargo
        fields = [
            'id', 'tipo', 'tipo_display', 'fecha', 'resolucion',
            'observaciones', 'estado', 'cargos_origen', 'cargos_destino',
            'puntaje_origen', 'puntaje_destino', 'fecha_creacion',
        ]
