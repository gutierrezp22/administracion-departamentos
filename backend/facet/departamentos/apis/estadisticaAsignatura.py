from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from ..models import EstadisticaAsignatura
from ..serializers import EstadisticaAsignaturaSerializer
from .pagination import StandardResultsSetPagination


class EstadisticaAsignaturaViewSet(viewsets.ModelViewSet):
    """CRUD de matrícula por asignatura, carrera y año."""

    permission_classes = [AllowAny]
    queryset = EstadisticaAsignatura.objects.all()
    serializer_class = EstadisticaAsignaturaSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        'estado': ['exact'],
        'asignatura': ['exact'],
        'carrera': ['exact'],
        'anio': ['exact', 'gte', 'lte'],
    }
    search_fields = ['asignatura__nombre', 'carrera__nombre']
    ordering_fields = ['anio', 'inscriptos', 'aprobados', 'promovidos']

    def get_queryset(self):
        qs = EstadisticaAsignatura.objects.select_related(
            'asignatura', 'carrera').all()
        params = self.request.query_params
        if params.get('show_all', False):
            return qs
        if 'estado' in params:
            return qs
        return qs.filter(estado='1')

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.estado = '0'
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['post'], url_path='carga-masiva')
    def carga_masiva(self, request):
        """Alta/actualización en lote de estadísticas.

        Body: {"registros": [{asignatura, carrera, anio, inscriptos,
        aprobados, promovidos}, ...]}

        Sirve para importar de una la matrícula histórica que hoy vive en las
        planillas del SIU. Cada (asignatura, carrera, año) se actualiza si ya
        existe, en vez de fallar por la constraint única.
        """
        registros = request.data.get('registros')
        if not isinstance(registros, list) or not registros:
            return Response(
                {'detail': 'Enviá una lista no vacía en "registros".'},
                status=status.HTTP_400_BAD_REQUEST)

        creados, actualizados, errores = 0, 0, []
        for i, reg in enumerate(registros):
            clave = {
                'asignatura_id': reg.get('asignatura'),
                'carrera_id': reg.get('carrera'),
                'anio': reg.get('anio'),
            }
            if not all(clave.values()):
                errores.append({'fila': i, 'detail': 'Faltan asignatura, carrera o año.'})
                continue

            # Se busca el registro existente y se lo pasa como `instance`: sin
            # eso el validador de unicidad rechazaría toda actualización, que
            # es justamente lo que este endpoint tiene que permitir.
            existente = EstadisticaAsignatura.objects.filter(**clave).first()
            serializer = EstadisticaAsignaturaSerializer(
                existente, data=reg, partial=existente is not None)
            if not serializer.is_valid():
                errores.append({'fila': i, 'detail': serializer.errors})
                continue

            _, creado = EstadisticaAsignatura.objects.update_or_create(
                defaults={
                    'inscriptos': reg.get('inscriptos', 0),
                    'aprobados': reg.get('aprobados', 0),
                    'promovidos': reg.get('promovidos', 0),
                    'observaciones': reg.get('observaciones'),
                    'estado': '1',
                },
                **clave,
            )
            if creado:
                creados += 1
            else:
                actualizados += 1

        return Response(
            {'creados': creados, 'actualizados': actualizados, 'errores': errores},
            status=status.HTTP_207_MULTI_STATUS if errores else status.HTTP_200_OK)
