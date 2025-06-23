from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import AllowAny
from rest_framework.filters import SearchFilter
from ..models import Asignatura
from ..serializers import AsignaturaSerializer
from .pagination import StandardResultsSetPagination

class AsignaturaViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = Asignatura.objects.select_related('area', 'departamento').filter(estado='1')  # Solo objetos activos por defecto
    serializer_class = AsignaturaSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = {
        'estado': ['exact'],       # Filtrar por estado exacto (0 o 1)
        'nombre': ['icontains'],   # Filtrar por nombre que contiene el valor especificado
        'codigo': ['icontains'],   # Filtrar por código que contiene el valor especificado
        'tipo': ['exact'],         # Filtrar por tipo exacto
        'modulo': ['icontains'],   # Filtrar por módulo que contiene el valor especificado
        'programa': ['icontains'], # Filtrar por programa que contiene el valor especificado
    }
    search_fields = ['nombre', 'codigo', 'tipo', 'modulo', 'programa']

    def destroy(self, request, *args, **kwargs):
        """Soft delete: cambia el estado a '0' en lugar de eliminar físicamente"""
        instance = self.get_object()
        instance.estado = '0'  # Marcar como inactivo
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_queryset(self):
        """
        Permite obtener todos los objetos (incluyendo inactivos) si se especifica el parámetro 'show_all'
        o si se filtra explícitamente por estado
        """
        queryset = Asignatura.objects.select_related('area', 'departamento').all()
        
        # Si se especifica show_all, mostrar todos
        if self.request.query_params.get('show_all', False):
            return queryset
            
        # Si se filtra explícitamente por estado, no aplicar filtro automático
        if 'estado' in self.request.query_params:
            return queryset
            
        # Por defecto, mostrar solo activos
        return queryset.filter(estado='1')