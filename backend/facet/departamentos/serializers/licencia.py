from rest_framework import serializers

from ..models import Licencia


def _persona_mini(docente):
    if not docente:
        return None
    p = docente.persona
    return {
        'id': docente.id,
        'nombre': p.nombre,
        'apellido': p.apellido,
        'dni': p.dni,
        'legajo': p.legajo,
    }


class LicenciaSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    docente_detalle = serializers.SerializerMethodField()
    reemplazante_detalle = serializers.SerializerMethodField()
    vigente = serializers.SerializerMethodField()

    class Meta:
        model = Licencia
        fields = [
            'id', 'docente', 'docente_detalle',
            'tipo', 'tipo_display',
            'codigo_cargo', 'cargo_departamento',
            'fecha_inicio', 'fecha_fin', 'vigente',
            'resolucion', 'expediente',
            'reemplazante', 'reemplazante_detalle',
            'observaciones', 'estado',
            'fecha_creacion', 'fecha_modificacion',
        ]
        read_only_fields = ['fecha_creacion', 'fecha_modificacion']

    def get_docente_detalle(self, obj):
        return _persona_mini(obj.docente)

    def get_reemplazante_detalle(self, obj):
        return _persona_mini(obj.reemplazante)

    def get_vigente(self, obj):
        from datetime import date
        return obj.vigente_a(date.today())

    def validate(self, attrs):
        instancia = self.instance
        inicio = attrs.get('fecha_inicio', getattr(instancia, 'fecha_inicio', None))
        fin = attrs.get('fecha_fin', getattr(instancia, 'fecha_fin', None))
        if inicio and fin and fin < inicio:
            raise serializers.ValidationError({
                'fecha_fin': 'La fecha de fin no puede ser anterior al inicio.',
            })

        docente = attrs.get('docente', getattr(instancia, 'docente', None))
        reemplazante = attrs.get('reemplazante', getattr(instancia, 'reemplazante', None))
        if docente and reemplazante and docente == reemplazante:
            raise serializers.ValidationError({
                'reemplazante': 'El reemplazante no puede ser el mismo docente.',
            })
        return attrs
