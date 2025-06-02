from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import AllowAny
from rest_framework.filters import SearchFilter
from ..models import Resolucion
from ..serializers import ResolucionSerializer

class ResolucionViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = Resolucion.objects.filter(estado='1')  # Solo objetos activos por defecto
    serializer_class = ResolucionSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = {
        'estado': ['exact'],
        'nexpediente': ['icontains'], 
        'nresolucion': ['icontains'],
        'tipo': ['exact'], 
        'fecha': ['date'], 
    }
    search_fields = ['nexpediente', 'nresolucion', 'tipo']

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
        queryset = Resolucion.objects.all()
        
        # Si se especifica show_all, mostrar todos
        if self.request.query_params.get('show_all', False):
            return queryset
            
        # Si se filtra explícitamente por estado, no aplicar filtro automático
        if 'estado' in self.request.query_params:
            return queryset
            
        # Por defecto, mostrar solo activos
        return queryset.filter(estado='1')
