from rest_framework import serializers
from ..models import CargoHistorial, CargoDepartamento, Docente, NoDocente, Resolucion


class CargoHistorialSerializer(serializers.ModelSerializer):
    cargo_departamento = serializers.PrimaryKeyRelatedField(
        queryset=CargoDepartamento.objects.all())
    docente = serializers.PrimaryKeyRelatedField(
        queryset=Docente.objects.all(), allow_null=True, required=False)
    no_docente = serializers.PrimaryKeyRelatedField(
        queryset=NoDocente.objects.all(), allow_null=True, required=False)
    resolucion = serializers.PrimaryKeyRelatedField(
        queryset=Resolucion.objects.all(), allow_null=True, required=False)

    class Meta:
        model = CargoHistorial
        fields = '__all__'

    def validate(self, attrs):
        if attrs.get('docente') and attrs.get('no_docente'):
            raise serializers.ValidationError(
                'docente y no_docente son mutuamente exclusivos.')
        return attrs


class CargoHistorialDetailSerializer(serializers.ModelSerializer):
    cargo_departamento_descripcion = serializers.CharField(
        source='cargo_departamento.descripcion', read_only=True)
    docente_detalle = serializers.SerializerMethodField()
    no_docente_detalle = serializers.SerializerMethodField()
    resolucion_detalle = serializers.SerializerMethodField()
    duracion_dias = serializers.SerializerMethodField()
    vacante = serializers.SerializerMethodField()

    class Meta:
        model = CargoHistorial
        fields = (
            'id', 'cargo_departamento', 'cargo_departamento_descripcion',
            'docente', 'docente_detalle',
            'no_docente', 'no_docente_detalle',
            'fecha_inicio', 'fecha_fin', 'duracion_dias', 'vacante',
            'resolucion', 'resolucion_detalle', 'motivo_fin', 'observaciones', 'estado',
        )

    def _persona_dict(self, persona, role_id):
        return {
            'id': role_id,
            'nombre': persona.nombre,
            'apellido': persona.apellido,
            'dni': persona.dni,
            'legajo': persona.legajo,
        }

    def get_docente_detalle(self, obj):
        if not obj.docente:
            return None
        return self._persona_dict(obj.docente.persona, obj.docente.id)

    def get_no_docente_detalle(self, obj):
        if not obj.no_docente:
            return None
        return self._persona_dict(obj.no_docente.persona, obj.no_docente.id)

    def get_resolucion_detalle(self, obj):
        if not obj.resolucion:
            return None
        return {
            'id': obj.resolucion.id,
            'nresolucion': obj.resolucion.nresolucion,
            'nexpediente': obj.resolucion.nexpediente,
        }

    def get_duracion_dias(self, obj):
        from django.utils.timezone import now
        fin = obj.fecha_fin or now().date()
        return (fin - obj.fecha_inicio).days

    def get_vacante(self, obj):
        return obj.docente is None and obj.no_docente is None
