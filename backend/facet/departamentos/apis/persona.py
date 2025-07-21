from rest_framework import viewsets, filters, status
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import AllowAny
from rest_framework.filters import SearchFilter
from ..models import Persona
from ..serializers import PersonaSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from datetime import date, timedelta
from django.utils import timezone

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
        'fecha_nacimiento': ['exact', 'gte', 'lte'],  # Filtrar por fecha de nacimiento
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
                    'titulo': persona.titulo.nombre if persona.titulo else None,
                    'fecha_nacimiento': persona.fecha_nacimiento
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
                'titulo': persona.titulo.nombre if persona.titulo else None,
                'fecha_nacimiento': persona.fecha_nacimiento
            }
            for persona in queryset
        ]

        return Response(personas_data)

    @action(detail=False, methods=['get'], url_path='proximos-jubilados')
    def proximos_jubilados(self, request):
        """Obtiene personas próximas a jubilarse (65 y 70 años)"""
        edad_65 = request.query_params.get('edad_65', 'true').lower() == 'true'
        edad_70 = request.query_params.get('edad_70', 'true').lower() == 'true'
        
        hoy = date.today()
        personas_jubilacion = []
        
        # Calcular fechas de referencia
        if edad_65:
            # Personas que cumplen 65 años en los próximos 2 años
            fecha_65_inicio = hoy - timedelta(days=65*365)
            fecha_65_fin = hoy - timedelta(days=63*365)
            
            personas_65 = self.get_queryset().filter(
                fecha_nacimiento__gte=fecha_65_fin,
                fecha_nacimiento__lte=fecha_65_inicio
            )
            
            for persona in personas_65:
                if persona.fecha_nacimiento:
                    edad_actual = (hoy - persona.fecha_nacimiento).days // 365
                    personas_jubilacion.append({
                        'id': persona.id,
                        'nombre': persona.nombre,
                        'apellido': persona.apellido,
                        'dni': persona.dni,
                        'legajo': persona.legajo,
                        'fecha_nacimiento': persona.fecha_nacimiento,
                        'edad_actual': edad_actual,
                        'tipo_jubilacion': '65 años',
                        'email': persona.email,
                        'titulo': persona.titulo.nombre if persona.titulo else None
                    })
        
        if edad_70:
            # Personas que cumplen 70 años en los próximos 2 años
            fecha_70_inicio = hoy - timedelta(days=70*365)
            fecha_70_fin = hoy - timedelta(days=68*365)
            
            personas_70 = self.get_queryset().filter(
                fecha_nacimiento__gte=fecha_70_fin,
                fecha_nacimiento__lte=fecha_70_inicio
            )
            
            for persona in personas_70:
                if persona.fecha_nacimiento:
                    edad_actual = (hoy - persona.fecha_nacimiento).days // 365
                    personas_jubilacion.append({
                        'id': persona.id,
                        'nombre': persona.nombre,
                        'apellido': persona.apellido,
                        'dni': persona.dni,
                        'legajo': persona.legajo,
                        'fecha_nacimiento': persona.fecha_nacimiento,
                        'edad_actual': edad_actual,
                        'tipo_jubilacion': '70 años',
                        'email': persona.email,
                        'titulo': persona.titulo.nombre if persona.titulo else None
                    })
        
        # Ordenar por edad (mayor a menor)
        personas_jubilacion.sort(key=lambda x: x['edad_actual'], reverse=True)
        
        return Response({
            'count': len(personas_jubilacion),
            'results': personas_jubilacion
        })
