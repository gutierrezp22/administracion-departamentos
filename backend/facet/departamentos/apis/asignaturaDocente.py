from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import AllowAny
from rest_framework.filters import SearchFilter
from rest_framework.decorators import action
from ..models import AsignaturaDocente
from datetime import datetime, timedelta
from django.utils.timezone import now
from ..serializers import AsignaturaDocenteSerializer, AsignaturaDocenteCreateSerializer, AsignaturaDocenteDetailSerializer

class AsignaturaDocenteViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = AsignaturaDocente.objects.filter(estado='1')  # Solo objetos activos por defecto
    serializer_class = AsignaturaDocenteSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = {
        'estado': ['exact'],
        'docente__persona__legajo': ['icontains'],
        'docente__persona__apellido': ['icontains'],
        'docente__persona__nombre': ['icontains'],
        'docente__persona__dni': ['icontains'],
        'asignatura__nombre': ['icontains'],
        'resolucion__nresolucion': ['icontains'],
    }
    search_fields = ['docente__persona__nombre', 'docente__persona__apellido', 'asignatura__nombre']

    def get_serializer_class(self):
        # Verificar si la solicitud está disponible
        if self.request and self.request.method:
            if self.request.method in ['POST', 'PUT', 'PATCH']:
                return AsignaturaDocenteCreateSerializer
        return AsignaturaDocenteDetailSerializer

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
        queryset = AsignaturaDocente.objects.select_related('docente__persona', 'asignatura', 'resolucion').all()
        
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
        """
        Devuelve los datos de AsignaturaDocente con los datos completos del docente y su persona, 
        incluyendo fecha de inicio y fecha de vencimiento.
        """
        queryset = AsignaturaDocente.objects.select_related(
            'docente__persona', 'asignatura', 'resolucion'
        ).filter(asignatura__id=request.query_params.get('asignatura'))

        # Aplicar filtro de estado si no se especifica show_all
        if not request.query_params.get('show_all', False):
            queryset = queryset.filter(estado='1')

        data = [
            {
                'id': asignatura_docente.id,
                'condicion': asignatura_docente.condicion,
                'cargo': asignatura_docente.cargo,
                'dedicacion': asignatura_docente.dedicacion,
                'estado': asignatura_docente.estado,
                'fecha_de_inicio': asignatura_docente.fecha_de_inicio,
                'fecha_de_vencimiento': asignatura_docente.fecha_de_vencimiento,
                'notificado': asignatura_docente.notificado,
                'docente': {
                    'id': asignatura_docente.docente.id,
                    'persona': {
                        'id': asignatura_docente.docente.persona.id,
                        'nombre': asignatura_docente.docente.persona.nombre,
                        'apellido': asignatura_docente.docente.persona.apellido,
                        'dni': asignatura_docente.docente.persona.dni,
                        'estado': asignatura_docente.docente.persona.estado,
                        'email': asignatura_docente.docente.persona.email, 
                    },
                },
            }
            for asignatura_docente in queryset
        ]

        return Response(data)
        
    @action(detail=False, methods=['get'], url_path='proximos_a_vencer')
    def proximos_a_vencer(self, request):
        """
        Devuelve las asignaciones docentes cuya fecha de vencimiento está próxima a ocurrir (en los próximos 30 días).
        """
        dias_limite = int(request.query_params.get('dias', 30))  # Permite ajustar el límite con un parámetro opcional
        fecha_limite = now() + timedelta(days=dias_limite)

        queryset = AsignaturaDocente.objects.select_related('docente__persona').filter(
            fecha_de_vencimiento__lte=fecha_limite,
            fecha_de_vencimiento__gte=now()
        )

        # Aplicar filtro de estado si no se especifica show_all
        if not request.query_params.get('show_all', False):
            queryset = queryset.filter(estado='1')

        data = [
            {
                'id': asignatura_docente.id,
                'condicion': asignatura_docente.condicion,
                'cargo': asignatura_docente.cargo,
                'dedicacion': asignatura_docente.dedicacion,
                'fecha_de_inicio': asignatura_docente.fecha_de_inicio,  # Agregar este campo
                'fecha_de_vencimiento': asignatura_docente.fecha_de_vencimiento,
                'notificado': asignatura_docente.notificado,
                'docente': {
                    'id': asignatura_docente.docente.id,
                    'persona': {
                        'id': asignatura_docente.docente.persona.id,
                        'nombre': asignatura_docente.docente.persona.nombre,
                        'apellido': asignatura_docente.docente.persona.apellido,
                        'dni': asignatura_docente.docente.persona.dni,
                    },
                },
            }
            for asignatura_docente in queryset
        ]

        return Response(data)