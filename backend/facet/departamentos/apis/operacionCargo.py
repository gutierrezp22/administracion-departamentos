from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.filters import OrderingFilter
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend

from ..models import OperacionCargo
from ..serializers import OperacionCargoSerializer


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class OperacionCargoViewSet(viewsets.ReadOnlyModelViewSet):
    """Solo lectura: las operaciones se crean vía endpoints en CargoViewSet
    (descomponer / combinar / renovar)."""
    permission_classes = [AllowAny]
    queryset = OperacionCargo.objects.prefetch_related(
        'cargos_origen__tipo_cargo', 'cargos_destino__tipo_cargo'
    ).all()
    serializer_class = OperacionCargoSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = {
        'tipo': ['exact'],
        'estado': ['exact'],
        'fecha': ['exact', 'gte', 'lte'],
    }
    ordering_fields = ['fecha', 'fecha_creacion']
