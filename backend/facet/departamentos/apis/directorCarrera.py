from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from ..models import DirectorCarrera
from ..serializers import DirectorCarreraSerializer

class DirectorCarreraViewSet(viewsets.ModelViewSet):
    queryset = DirectorCarrera.objects.filter(estado='1')  # Solo objetos activos por defecto
    serializer_class = DirectorCarreraSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = {
        'estado': ['exact'],
        'carrera__nombre': ['icontains'],
        'director__persona__apellido': ['icontains'],
        'director__persona__nombre': ['icontains'],
        'resolucion__nresolucion': ['icontains'],
    }
    search_fields = ['carrera__nombre', 'director__persona__apellido', 'director__persona__nombre']

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
        queryset = DirectorCarrera.objects.select_related('carrera', 'director__persona', 'resolucion').all()
        
        # Si se especifica show_all, mostrar todos
        if self.request.query_params.get('show_all', False):
            return queryset
            
        # Si se filtra explícitamente por estado, no aplicar filtro automático
        if 'estado' in self.request.query_params:
            return queryset
            
        # Por defecto, mostrar solo activos
        return queryset.filter(estado='1')