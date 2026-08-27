from datetime import date

from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from ..models import Licencia
from ..serializers import LicenciaSerializer
from .pagination import StandardResultsSetPagination


class LicenciaViewSet(viewsets.ModelViewSet):
    """CRUD de licencias docentes."""

    permission_classes = [AllowAny]
    queryset = Licencia.objects.all()
    serializer_class = LicenciaSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        'estado': ['exact'],
        'tipo': ['exact', 'in'],
        'docente': ['exact'],
        'reemplazante': ['exact', 'isnull'],
        'codigo_cargo': ['exact'],
        'fecha_inicio': ['exact', 'gte', 'lte'],
        'fecha_fin': ['exact', 'gte', 'lte', 'isnull'],
    }
    search_fields = [
        'docente__persona__apellido', 'docente__persona__nombre', 'expediente',
    ]
    ordering_fields = ['fecha_inicio', 'fecha_fin', 'tipo']

    def get_queryset(self):
        qs = Licencia.objects.select_related(
            'docente__persona', 'reemplazante__persona',
            'resolucion', 'cargo_departamento',
        ).all()

        params = self.request.query_params
        if params.get('vigentes') in ('1', 'true', 'True'):
            hoy = date.today()
            qs = qs.filter(fecha_inicio__lte=hoy).filter(
                Q(fecha_fin__isnull=True) | Q(fecha_fin__gte=hoy))

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
