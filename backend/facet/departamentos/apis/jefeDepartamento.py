from rest_framework import viewsets, filters, status
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import AllowAny
from rest_framework.filters import SearchFilter
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils.timezone import now, timedelta
from django.db.models import Prefetch
from rest_framework.pagination import PageNumberPagination

from ..models import JefeDepartamento
from ..serializers import JefeDepartamentoCreateSerializer, JefeDepartamentoDetailSerializer


# 📌 Definir la paginación personalizada
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10  # Número de elementos por página
    page_size_query_param = 'page_size'
    max_page_size = 100


class JefeDepartamentoViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = JefeDepartamento.objects.filter(estado='1')  # Solo objetos activos por defecto
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = {
        'estado': ['exact'],
        'departamento__nombre': ['icontains'],
        'jefe__persona__apellido': ['icontains'],
        'jefe__persona__nombre': ['icontains'],
        'resolucion__nresolucion': ['icontains'],
    }
    search_fields = ['departamento__nombre', 'jefe__persona__apellido', 'jefe__persona__nombre']

    def get_serializer_class(self):
        if self.request and self.request.method:
            if self.request.method in ['POST', 'PUT', 'PATCH']:
                return JefeDepartamentoCreateSerializer
        return JefeDepartamentoDetailSerializer

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
        queryset = JefeDepartamento.objects.select_related('departamento', 'jefe__persona', 'resolucion').all()
        
        # Si se especifica show_all, mostrar todos
        if self.request.query_params.get('show_all', False):
            return queryset
            
        # Si se filtra explícitamente por estado, no aplicar filtro automático
        if 'estado' in self.request.query_params:
            return queryset
            
        # Por defecto, mostrar solo activos
        return queryset.filter(estado='1')

    @action(detail=False, methods=['get'], url_path='list_detalle')
    def list_detalle(self, request):
        """🔹 Devuelve Jefes de Departamento paginados con información completa."""
        queryset = JefeDepartamento.objects.select_related(
            'jefe__persona', 'departamento', 'resolucion'
        ).all()

        paginator = StandardResultsSetPagination()
        paginated_queryset = paginator.paginate_queryset(queryset, request)

        data = [
            {
                'id': depto_jefe.id,
                'observaciones': depto_jefe.observaciones,
                'estado': depto_jefe.estado,
                'notificado': depto_jefe.notificado,  # ✅ Agregado campo notificado
                'fecha_de_inicio': depto_jefe.fecha_de_inicio,
                'fecha_de_fin': depto_jefe.fecha_de_fin,
                'departamento': {
                    'id': depto_jefe.departamento.id,
                    'nombre': depto_jefe.departamento.nombre,
                },
                'resolucion': {
                    'id': depto_jefe.resolucion.id,
                    'nresolucion': depto_jefe.resolucion.nresolucion,
                    'nexpediente': depto_jefe.resolucion.nexpediente,
                },
                'jefe': {
                    'id': depto_jefe.jefe.id,
                    'observaciones': depto_jefe.jefe.observaciones,
                    'persona': {
                        'id': depto_jefe.jefe.persona.id,
                        'nombre': depto_jefe.jefe.persona.nombre,
                        'apellido': depto_jefe.jefe.persona.apellido,
                        'dni': depto_jefe.jefe.persona.dni,
                        'legajo': depto_jefe.jefe.persona.legajo,
                        'telefono': depto_jefe.jefe.persona.telefono,
                        'email': depto_jefe.jefe.persona.email,
                    },
                },
            }
            for depto_jefe in paginated_queryset
        ]

        return paginator.get_paginated_response(data)  # ✅ Respuesta paginada


    @action(detail=True, methods=['get'], url_path='obtener_detalle')
    def obtener_detalle(self, request, pk=None):
        """🔹 Obtener detalle de un JefeDepartamento específico."""
        jefe_departamento = self.get_object()
        data = {
            'id': jefe_departamento.id,
            'observaciones': jefe_departamento.observaciones,
            'estado': jefe_departamento.estado,
            'notificado': jefe_departamento.notificado,  # ✅ Agregado campo notificado
            'fecha_de_inicio': jefe_departamento.fecha_de_inicio,
            'fecha_de_fin': jefe_departamento.fecha_de_fin,
            'departamento': {
                'id': jefe_departamento.departamento.id,
                'nombre': jefe_departamento.departamento.nombre,
            },
            'resolucion': {
                'id': jefe_departamento.resolucion.id,
                'nresolucion': jefe_departamento.resolucion.nresolucion,
                'nexpediente': jefe_departamento.resolucion.nexpediente,
            },
            'jefe': {
                'id': jefe_departamento.jefe.id,
                'observaciones': jefe_departamento.jefe.observaciones,
                'persona': {
                    'id': jefe_departamento.jefe.persona.id,
                    'nombre': jefe_departamento.jefe.persona.nombre,
                    'apellido': jefe_departamento.jefe.persona.apellido,
                    'dni': jefe_departamento.jefe.persona.dni,
                    'legajo': jefe_departamento.jefe.persona.legajo,
                    'telefono': jefe_departamento.jefe.persona.telefono,
                    'email': jefe_departamento.jefe.persona.email,
                },
            },
        }
        return Response(data)

    
    @action(detail=False, methods=['get'], url_path='list_proximos_vencimientos')
    def list_proximos_vencimientos(self, request):
        """🔹 Lista Jefes Departamentos cuyos cargos vencen en los próximos 30 días."""
        fecha_limite = now().date() + timedelta(days=30)

        queryset = JefeDepartamento.objects.select_related(
            'departamento', 'resolucion', 'jefe__persona'
        ).filter(
            fecha_de_fin__lte=fecha_limite,
            fecha_de_fin__gte=now().date()
        )

        paginator = StandardResultsSetPagination()
        paginated_queryset = paginator.paginate_queryset(queryset, request)

        data = [
            {
                'id': depto_jefe.id,
                'observaciones': depto_jefe.observaciones,
                'estado': depto_jefe.estado,
                'notificado': depto_jefe.notificado,  # ✅ Agregado campo notificado
                'fecha_de_inicio': depto_jefe.fecha_de_inicio,
                'fecha_de_fin': depto_jefe.fecha_de_fin,
                'departamento': {
                    'id': depto_jefe.departamento.id,
                    'nombre': depto_jefe.departamento.nombre,
                } if depto_jefe.departamento else None,
                'resolucion': {
                    'id': depto_jefe.resolucion.id,
                    'nresolucion': depto_jefe.resolucion.nresolucion,
                    'nexpediente': depto_jefe.resolucion.nexpediente,
                } if depto_jefe.resolucion else None,
                'jefe': {
                    'id': depto_jefe.jefe.id,
                    'observaciones': depto_jefe.jefe.observaciones,
                    'persona': {
                        'id': depto_jefe.jefe.persona.id,
                        'nombre': depto_jefe.jefe.persona.nombre,
                        'apellido': depto_jefe.jefe.persona.apellido,
                        'dni': depto_jefe.jefe.persona.dni,
                        'legajo': depto_jefe.jefe.persona.legajo,
                        'telefono': depto_jefe.jefe.persona.telefono,
                        'email': depto_jefe.jefe.persona.email if depto_jefe.jefe.persona.email else "No disponible",
                    } if depto_jefe.jefe and depto_jefe.jefe.persona else None,
                } if depto_jefe.jefe else None,
            }
            for depto_jefe in paginated_queryset
        ]

        return paginator.get_paginated_response(data)



    # def get_serializer_class(self):
    #     if self.action in ['list_detalle', 'list_proximos_vencimientos']:
    #         return JefeDepartamentoDetailSerializer  # Usar serializador con relaciones completas
    #     elif self.request and self.request.method in ['POST', 'PUT', 'PATCH']:
    #         return JefeDepartamentoCreateSerializer
    #     return JefeDepartamentoSerializer
