from rest_framework import serializers

from ..models import EstadisticaAsignatura


class EstadisticaAsignaturaSerializer(serializers.ModelSerializer):
    asignatura_detalle = serializers.SerializerMethodField()
    carrera_detalle = serializers.SerializerMethodField()
    tasa_aprobacion = serializers.FloatField(read_only=True)

    class Meta:
        model = EstadisticaAsignatura
        fields = [
            'id',
            'asignatura', 'asignatura_detalle',
            'carrera', 'carrera_detalle',
            'anio', 'inscriptos', 'aprobados', 'promovidos',
            'tasa_aprobacion', 'observaciones', 'estado',
            'fecha_creacion', 'fecha_modificacion',
        ]
        read_only_fields = ['fecha_creacion', 'fecha_modificacion']

    def get_asignatura_detalle(self, obj):
        if not obj.asignatura_id:
            return None
        return {
            'id': obj.asignatura.id,
            'nombre': obj.asignatura.nombre,
            'codigo': obj.asignatura.codigo,
            'codigo_siu': obj.asignatura.codigo_siu,
        }

    def get_carrera_detalle(self, obj):
        if not obj.carrera_id:
            return None
        return {'id': obj.carrera.id, 'nombre': obj.carrera.nombre}

    def validate(self, attrs):
        instancia = self.instance
        insc = attrs.get('inscriptos', getattr(instancia, 'inscriptos', 0))
        apr = attrs.get('aprobados', getattr(instancia, 'aprobados', 0))
        prom = attrs.get('promovidos', getattr(instancia, 'promovidos', 0))
        if insc is not None and (apr + prom) > insc:
            raise serializers.ValidationError({
                'aprobados': 'Aprobados + promovidos no puede superar a los inscriptos.',
            })
        anio = attrs.get('anio', getattr(instancia, 'anio', None))
        if anio is not None and not (1990 <= anio <= 2100):
            raise serializers.ValidationError({'anio': 'Año fuera de rango.'})
        return attrs
