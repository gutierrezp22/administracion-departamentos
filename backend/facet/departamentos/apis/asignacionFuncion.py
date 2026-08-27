from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from ..models import AsignacionFuncion
from ..serializers import AsignacionFuncionSerializer
from .pagination import StandardResultsSetPagination


class AsignacionFuncionViewSet(viewsets.ModelViewSet):
    """CRUD de asignaciones de funciones (laboratorios, gabinetes, etc.)."""

    permission_classes = [AllowAny]
    queryset = AsignacionFuncion.objects.all()
    serializer_class = AsignacionFuncionSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        'estado': ['exact'],
        'docente': ['exact'],
        'departamento': ['exact'],
        'area': ['exact'],
        'fecha_desde': ['exact', 'gte', 'lte'],
        'fecha_hasta': ['exact', 'gte', 'lte', 'isnull'],
    }
    search_fields = [
        'descripcion', 'expediente',
        'docente__persona__apellido', 'docente__persona__nombre',
    ]
    ordering_fields = ['descripcion', 'fecha_desde']

    def get_queryset(self):
        qs = AsignacionFuncion.objects.select_related(
            'docente__persona', 'departamento', 'area', 'resolucion').all()
        params = self.request.query_params
        if params.get('show_all', False):
            return qs
        if 'estado' in params:
            return qs
        return qs.filter(estado='1')

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.estado = '0'
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
