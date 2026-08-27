from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from ..models import Seguimiento
from ..serializers import SeguimientoSerializer
from .pagination import StandardResultsSetPagination


class SeguimientoViewSet(viewsets.ModelViewSet):
    """CRUD de novedades de seguimiento del departamento."""

    permission_classes = [AllowAny]
    queryset = Seguimiento.objects.all()
    serializer_class = SeguimientoSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        'estado': ['exact'],
        'estado_seguimiento': ['exact', 'in'],
        'tipo': ['exact', 'in'],
        'prioridad': ['exact'],
        'docente': ['exact'],
        'responsable': ['exact', 'icontains'],
        'fecha_novedad': ['exact', 'gte', 'lte'],
    }
    search_fields = [
        'descripcion', 'responsable',
        'docente__persona__apellido', 'docente__persona__nombre',
    ]
    ordering_fields = ['fecha_novedad', 'prioridad', 'estado_seguimiento']

    def get_queryset(self):
        qs = Seguimiento.objects.select_related(
            'docente__persona', 'designacion').all()

        params = self.request.query_params
        if params.get('abiertos') in ('1', 'true', 'True'):
            qs = qs.filter(estado_seguimiento__in=['pendiente', 'en_curso'])

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
