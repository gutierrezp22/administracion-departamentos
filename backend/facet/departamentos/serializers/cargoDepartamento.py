from rest_framework import serializers
from ..models import CargoDepartamento


class CargoDepartamentoSerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        asignatura = attrs.get('asignatura')
        departamento = attrs.get('departamento') or (
            self.instance.departamento if self.instance else None)
        if asignatura and departamento and asignatura.departamento_id != departamento.id:
            raise serializers.ValidationError({
                'asignatura': 'La asignatura debe pertenecer al mismo departamento.',
            })
        return attrs


    puntaje = serializers.DecimalField(
        max_digits=4, decimal_places=2, read_only=True)
    departamento_detalle = serializers.SerializerMethodField()
    asignatura_detalle = serializers.SerializerMethodField()
    tipo_cargo_detalle = serializers.SerializerMethodField()
    cargo_vinculado = serializers.SerializerMethodField()
    ocupacion_actual = serializers.SerializerMethodField()

    class Meta:
        model = CargoDepartamento
        fields = [
            'id', 'descripcion',
            'departamento', 'departamento_detalle',
            'asignatura', 'asignatura_detalle',
            'tipo_cargo', 'tipo_cargo_detalle',
            'puntaje', 'observaciones', 'estado',
            'fecha_creacion', 'fecha_modificacion',
            'cargo_vinculado', 'ocupacion_actual',
        ]

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

    def get_cargo_vinculado(self, obj):
        """Cargo (plata) vinculado a este Cargo de Departamento (1:1)."""
        cargo = getattr(obj, 'cargo', None)
        if not cargo:
            return None
        return {
            'id': cargo.id,
            'numero_de_cargo': cargo.numero_de_cargo,
            'tipo_cargo': cargo.tipo_cargo_id,
            'puntaje': cargo.puntaje,
            'estado': cargo.estado,
        }

    def get_ocupacion_actual(self, obj):
        """Período vigente del ocupante (docente/no_docente) o el último."""
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
            'vacante': ocupante is None,
        }
