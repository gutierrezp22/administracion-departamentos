from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.filters import SearchFilter
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend

from ..models import CargoHistorial
from ..serializers import CargoHistorialSerializer, CargoHistorialDetailSerializer


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class CargoHistorialViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = CargoHistorial.objects.filter(estado='1')
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = {
        'estado': ['exact'],
        'cargo': ['exact'],
        'cargo__numero_de_cargo': ['exact'],
        'docente': ['exact'],
        'docente__persona__dni': ['icontains'],
        'docente__persona__apellido': ['icontains'],
        'motivo_fin': ['exact'],
        'fecha_inicio': ['gte', 'lte'],
        'fecha_fin': ['gte', 'lte', 'isnull'],
    }
    search_fields = [
        'cargo__numero_de_cargo',
        'docente__persona__nombre',
        'docente__persona__apellido',
    ]

    def get_serializer_class(self):
        if self.request and self.request.method in ['POST', 'PUT', 'PATCH']:
            return CargoHistorialSerializer
        return CargoHistorialDetailSerializer

    def destroy(self, request, *args, **kwargs):
        """Soft delete: estado='0'."""
        instance = self.get_object()
        instance.estado = '0'
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_queryset(self):
        queryset = CargoHistorial.objects.select_related(
            'cargo', 'docente__persona', 'resolucion'
        ).all()
        if self.request.query_params.get('show_all', False):
            return queryset
        if 'estado' in self.request.query_params:
            return queryset
        return queryset.filter(estado='1')
