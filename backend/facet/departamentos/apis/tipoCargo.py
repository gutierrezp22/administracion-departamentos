from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend

from ..models import TipoCargo
from ..serializers import TipoCargoSerializer


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100


class TipoCargoViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = TipoCargo.objects.all()
    serializer_class = TipoCargoSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        'estado': ['exact'],
        'dedicacion': ['exact'],
        'sigla': ['exact', 'icontains'],
        'descripcion': ['exact', 'icontains'],
        'puntaje': ['exact', 'gte', 'lte', 'isnull'],
    }
    search_fields = ['sigla', 'descripcion']
    ordering_fields = ['descripcion', 'dedicacion', 'puntaje']

    def get_queryset(self):
        qs = TipoCargo.objects.all()
        if self.request.query_params.get('show_all', False):
            return qs
        if 'estado' in self.request.query_params:
            return qs
        return qs.filter(estado='1')

    def destroy(self, request, *args, **kwargs):
        """Soft delete: estado='0'."""
        instance = self.get_object()
        instance.estado = '0'
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
