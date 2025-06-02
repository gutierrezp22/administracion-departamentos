from rest_framework import viewsets, filters, status
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import AllowAny
from rest_framework.filters import SearchFilter
from ..models import Persona
from ..serializers import PersonaSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

class PersonaViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = Persona.objects.select_related('titulo').filter(estado='1')  # Solo objetos activos por defecto
    serializer_class = PersonaSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = {
        'estado': ['exact'],       # Filtrar por estado exacto (0 o 1)
        'legajo': ['icontains'],       
        'apellido': ['icontains'], 
        'nombre': ['icontains'],
        'dni': ['icontains'], 
    }
    search_fields = ['nombre', 'apellido', 'dni', 'legajo']

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
        queryset = Persona.objects.select_related('titulo').all()
        
        # Si se especifica show_all, mostrar todos
        if self.request.query_params.get('show_all', False):
            return queryset
            
        # Si se filtra explícitamente por estado, no aplicar filtro automático
        if 'estado' in self.request.query_params:
            return queryset
            
        # Por defecto, mostrar solo activos
        return queryset.filter(estado='1')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        # Debugging: Verificar que se ejecuta el método

        # Aplica paginación si está configurada en DRF
        page = self.paginate_queryset(queryset)
        if page is not None:
            personas_data = [
                {
                    'id': persona.id,
                    'nombre': persona.nombre,
                    'apellido': persona.apellido,
                    'telefono': persona.telefono,
                    'dni': persona.dni,
                    'estado': persona.estado,
                    'email': persona.email,
                    'interno': persona.interno,
                    'legajo': persona.legajo,
                    'titulo': persona.titulo.nombre if persona.titulo else None  # 🔥 Ahora devuelve el nombre del título
                }
                for persona in page
            ]
            return self.get_paginated_response(personas_data)

        # Si no hay paginación, devolver la lista completa
        personas_data = [
            {
                'id': persona.id,
                'nombre': persona.nombre,
                'apellido': persona.apellido,
                'telefono': persona.telefono,
                'dni': persona.dni,
                'estado': persona.estado,
                'email': persona.email,
                'interno': persona.interno,
                'legajo': persona.legajo,
                'titulo': persona.titulo.nombre if persona.titulo else None
            }
            for persona in queryset
        ]

        return Response(personas_data)
