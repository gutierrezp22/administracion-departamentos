from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import viewsets, status
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import AllowAny
from ..models import Jefe
from ..serializers import JefeSerializer



class JefeViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = Jefe.objects.filter(estado='1')  # Solo objetos activos por defecto
    serializer_class = JefeSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        'estado': ['exact'],
        'persona__legajo': ['icontains'],
        'persona__apellido': ['icontains'],
        'persona__nombre': ['icontains'],
        'persona__dni': ['icontains'],
    }

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
        queryset = Jefe.objects.select_related('persona').all()
        
        # Si se especifica show_all, mostrar todos
        if self.request.query_params.get('show_all', False):
            return queryset
            
        # Si se filtra explícitamente por estado, no aplicar filtro automático
        if 'estado' in self.request.query_params:
            return queryset
            
        # Por defecto, mostrar solo activos
        return queryset.filter(estado='1')

    @action(detail=False, methods=['get'], url_path='list_jefes_persona')
    def list_jefes_persona(self, request):
        # Realizar la consulta de Jefes con datos de Persona
        jefes = Jefe.objects.select_related('persona').all()
        
        # Paginación
        paginator = PageNumberPagination()
        paginated_jefes = paginator.paginate_queryset(jefes, request)

        # Construir los datos paginados
        jefes_data = [
            {
                'id': jefe.id,
                'observaciones': jefe.observaciones,
                'estado': jefe.estado,
                'persona': {
                    'id': jefe.persona.id,
                    'nombre': jefe.persona.nombre,
                    'apellido': jefe.persona.apellido,
                    'dni': jefe.persona.dni,
                    'legajo': jefe.persona.legajo,
                    'telefono': jefe.persona.telefono,
                    'email': jefe.persona.email,
                }
            }
            for jefe in paginated_jefes
        ]

        # Devolver respuesta paginada
        return paginator.get_paginated_response(jefes_data)


    @action(detail=True, methods=['get'], url_path='obtener_jefe')
    def obtener_jefe(self, request, pk=None):
        # Obtener el jefe con datos relacionados de Persona
        jefe = Jefe.objects.select_related('persona').filter(id=pk).first()
        if jefe:
            data = {
                'id': jefe.id,
                'observaciones': jefe.observaciones,
                'estado': jefe.estado,
                'persona': {
                    'id': jefe.persona.id,
                    'nombre': jefe.persona.nombre,
                    'apellido': jefe.persona.apellido,
                    'dni': jefe.persona.dni,
                    'legajo': jefe.persona.legajo,
                    'telefono': jefe.persona.telefono,
                    'email': jefe.persona.email,
                }
            }
            return Response(data)
        else:
            return Response({'detail': 'Jefe no encontrado'}, status=404)
        
    @action(detail=False, methods=['get'], url_path='existe_jefe')
    def existe_jefe(self, request):
        """Verifica si una persona ya es jefe"""
        persona_id = request.query_params.get('persona_id', None)

        if not persona_id:
            return Response({"error": "Se requiere un ID de persona"}, status=status.HTTP_400_BAD_REQUEST)

        existe = Jefe.objects.filter(persona_id=persona_id).exists()
        return Response({"existe": existe}, status=status.HTTP_200_OK)

