from rest_framework import serializers

from ..models import Designacion


class DesignacionSerializer(serializers.ModelSerializer):
    """Serializer de lectura/escritura de designaciones.

    Expone el vencimiento derivado (`fecha_vencimiento` / `fuente_vencimiento`)
    para que el front no tenga que reimplementar la regla de duración por tipo.
    """

    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    docente_detalle = serializers.SerializerMethodField()
    tipo_cargo_detalle = serializers.SerializerMethodField()
    asignatura_detalle = serializers.SerializerMethodField()
    area_detalle = serializers.SerializerMethodField()
    resolucion_detalle = serializers.SerializerMethodField()
    fecha_vencimiento = serializers.SerializerMethodField()
    fuente_vencimiento = serializers.SerializerMethodField()
    vencimiento_estimado = serializers.SerializerMethodField()

    class Meta:
        model = Designacion
        fields = [
            'id', 'docente', 'docente_detalle',
            'tipo', 'tipo_display',
            'cargo_departamento',
            'tipo_cargo', 'tipo_cargo_detalle', 'codigo_cargo',
            'asignatura', 'asignatura_detalle',
            'area', 'area_detalle',
            'resolucion', 'resolucion_detalle',
            'tipo_instrumento', 'expediente', 'nro_resolucion', 'dgpres',
            'fecha_desde', 'fecha_hasta',
            'fecha_vencimiento', 'fuente_vencimiento', 'vencimiento_estimado',
            'en_tramite', 'renuncia_definitiva', 'rol_gestion',
            'texto_original', 'observaciones', 'estado',
            'fecha_creacion', 'fecha_modificacion',
        ]
        read_only_fields = ['fecha_creacion', 'fecha_modificacion']

    # ---- detalles anidados ----
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
        }

    def get_tipo_cargo_detalle(self, obj):
        if not obj.tipo_cargo:
            return None
        t = obj.tipo_cargo
        return {
            'id': t.id,
            'codigo': t.codigo,
            'descripcion': t.descripcion,
            'dedicacion': t.dedicacion,
            'rango': t.rango,
            'horas_semanales': t.horas_semanales,
            'denominacion': t.denominacion,
        }

    def get_asignatura_detalle(self, obj):
        if not obj.asignatura:
            return None
        return {
            'id': obj.asignatura.id,
            'nombre': obj.asignatura.nombre,
            'codigo': obj.asignatura.codigo,
        }

    def get_area_detalle(self, obj):
        if not obj.area:
            return None
        return {'id': obj.area.id, 'nombre': obj.area.nombre}

    def get_resolucion_detalle(self, obj):
        if not obj.resolucion:
            return None
        r = obj.resolucion
        return {
            'id': r.id,
            'nresolucion': r.nresolucion,
            'nexpediente': r.nexpediente,
            'tipo': r.tipo,
            'fecha': r.fecha,
        }

    # ---- vencimiento derivado ----
    def _venc(self, obj):
        return obj.vencimiento_estimado()

    def get_fecha_vencimiento(self, obj):
        fecha = self._venc(obj)[0]
        if fecha is None:
            return None
        # Se pasa por un DateField para que respete el DATE_FORMAT del
        # proyecto: sin esto la fecha derivada saldría en ISO mientras
        # `fecha_desde` sale en dd/mm/aaaa, dos formatos en la misma fila.
        return serializers.DateField().to_representation(fecha)

    def get_fuente_vencimiento(self, obj):
        return self._venc(obj)[1]

    def get_vencimiento_estimado(self, obj):
        """True si la fecha no es explícita sino derivada de la duración del tipo."""
        return obj.fecha_hasta is None and self._venc(obj)[0] is not None

    def validate(self, attrs):
        instancia = self.instance
        desde = attrs.get('fecha_desde', getattr(instancia, 'fecha_desde', None))
        hasta = attrs.get('fecha_hasta', getattr(instancia, 'fecha_hasta', None))
        if desde and hasta and hasta < desde:
            raise serializers.ValidationError({
                'fecha_hasta': 'La fecha de vencimiento no puede ser anterior al inicio.',
            })

        tipo = attrs.get('tipo', getattr(instancia, 'tipo', None))
        rol = attrs.get('rol_gestion', getattr(instancia, 'rol_gestion', None))
        if tipo == Designacion.PROR_CARGO_GESTION and not rol:
            raise serializers.ValidationError({
                'rol_gestion': 'Indicá el cargo de gestión que motiva la prórroga.',
            })

        definitiva = attrs.get(
            'renuncia_definitiva', getattr(instancia, 'renuncia_definitiva', False))
        if definitiva and tipo != Designacion.RENUNCIA:
            raise serializers.ValidationError({
                'renuncia_definitiva': 'Sólo aplica a designaciones de tipo RENUNCIA.',
            })

        return attrs
