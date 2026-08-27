from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from ..models import Designacion
from ..serializers import DesignacionSerializer
from .pagination import StandardResultsSetPagination


class DesignacionViewSet(viewsets.ModelViewSet):
    """CRUD de designaciones.

    Es la puerta de entrada de los datos que hoy están en texto libre en la
    planilla de planta. El reporte de planta se arma enteramente a partir de
    estos registros.
    """

    permission_classes = [AllowAny]
    queryset = Designacion.objects.all()
    serializer_class = DesignacionSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        'estado': ['exact'],
        'tipo': ['exact', 'in'],
        'docente': ['exact'],
        'codigo_cargo': ['exact'],
        'tipo_cargo': ['exact'],
        'cargo_departamento': ['exact', 'isnull'],
        'asignatura': ['exact'],
        'area': ['exact'],
        'en_tramite': ['exact'],
        'renuncia_definitiva': ['exact'],
        'fecha_desde': ['exact', 'gte', 'lte'],
        'fecha_hasta': ['exact', 'gte', 'lte', 'isnull'],
    }
    search_fields = [
        'docente__persona__apellido', 'docente__persona__nombre',
        'docente__persona__dni', 'expediente', 'nro_resolucion',
        'dgpres', 'rol_gestion',
    ]
    ordering_fields = ['fecha_desde', 'fecha_hasta', 'tipo', 'codigo_cargo']

    def get_queryset(self):
        qs = Designacion.objects.select_related(
            'docente__persona', 'tipo_cargo', 'asignatura', 'area',
            'resolucion', 'cargo_departamento',
        ).all()

        params = self.request.query_params

        # Filtro por departamento vía el cargo de departamento o la asignatura.
        depto = params.get('departamento')
        if depto:
            qs = qs.filter(
                cargo_departamento__departamento_id=depto
            ) | qs.filter(asignatura__departamento_id=depto)
            qs = qs.distinct()

        if params.get('show_all', False):
            return qs
        if 'estado' in params:
            return qs
        return qs.filter(estado='1')

    def destroy(self, request, *args, **kwargs):
        """Soft delete: estado='0'."""
        instance = self.get_object()
        instance.estado = '0'
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
