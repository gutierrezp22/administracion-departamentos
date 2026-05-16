from rest_framework import serializers
from ..models import Cargo


class CargoSerializer(serializers.ModelSerializer):
    ocupacion_actual = serializers.SerializerMethodField()
    puntaje = serializers.DecimalField(
        max_digits=4, decimal_places=2, read_only=True)
    tipo_cargo_detalle = serializers.SerializerMethodField()
    departamento_detalle = serializers.SerializerMethodField()
    asignatura_detalle = serializers.SerializerMethodField()
    resolucion_oficializacion_detalle = serializers.SerializerMethodField()

    class Meta:
        model = Cargo
        fields = [
            'id', 'numero_de_cargo',
            'tipo_cargo', 'tipo_cargo_detalle',
            'departamento', 'departamento_detalle',
            'asignatura', 'asignatura_detalle',
            'resolucion_oficializacion', 'resolucion_oficializacion_detalle',
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

    def get_departamento_detalle(self, obj):
        if not obj.departamento:
            return None
        return {
            'id': obj.departamento.id,
            'nombre': obj.departamento.nombre,
        }

    def get_asignatura_detalle(self, obj):
        if not obj.asignatura:
            return None
        return {
            'id': obj.asignatura.id,
            'nombre': obj.asignatura.nombre,
            'codigo': obj.asignatura.codigo,
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

    def get_ocupacion_actual(self, obj):
        """Devuelve el período vigente (fecha_fin null y estado activo) si existe.

        Si no hay período vigente, devuelve el último (más reciente por fecha_inicio)
        para que la UI muestre quién fue el último ocupante.
        """
        qs = obj.historial.filter(estado='1').select_related(
            'docente__persona', 'no_docente__persona')
        actual = qs.filter(fecha_fin__isnull=True).order_by('-fecha_inicio').first()
        if not actual:
            actual = qs.order_by('-fecha_inicio').first()
        if not actual:
            return None

        ocupante = None
        rol = None
        if actual.docente:
            p = actual.docente.persona
            rol = 'docente'
            ocupante = {
                'id': actual.docente.id,
                'nombre': p.nombre,
                'apellido': p.apellido,
                'dni': p.dni,
                'legajo': p.legajo,
            }
        elif actual.no_docente:
            p = actual.no_docente.persona
            rol = 'no_docente'
            ocupante = {
                'id': actual.no_docente.id,
                'nombre': p.nombre,
                'apellido': p.apellido,
                'dni': p.dni,
                'legajo': p.legajo,
            }

        return {
            'id': actual.id,
            'fecha_inicio': actual.fecha_inicio,
            'fecha_fin': actual.fecha_fin,
            'vigente': actual.fecha_fin is None,
            'rol': rol,
            'ocupante': ocupante,
            # Aliases para compatibilidad con código que ya consume `docente`/`vacante`
            'docente': ocupante if rol == 'docente' else None,
            'vacante': ocupante is None,
        }
