from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend

from ..models import Cargo, CargoDepartamento, Resolucion
from ..serializers import CargoSerializer


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class CargoViewSet(viewsets.ModelViewSet):
    """Vista del payroll (cargos del Excel). Las operaciones de
    descomposición / combinación / renovación / historial de ocupantes viven
    en CargoDepartamentoViewSet. Acá solo se administra el dato bruto del
    payroll y su vínculo a un Cargo de Departamento.
    """
    permission_classes = [AllowAny]
    queryset = Cargo.objects.all()
    serializer_class = CargoSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        'estado': ['exact'],
        'numero_de_cargo': ['exact', 'icontains'],
        'tipo_cargo': ['exact'],
        'tipo_cargo__sigla': ['exact'],
        'tipo_cargo__dedicacion': ['exact'],
        'tipo_cargo__descripcion': ['exact', 'icontains'],
        'cargo_departamento': ['exact', 'isnull'],
        'cargo_departamento__departamento': ['exact'],
        'cargo_departamento__asignatura': ['exact', 'isnull'],
    }
    search_fields = ['numero_de_cargo', 'tipo_cargo__descripcion', 'tipo_cargo__sigla']
    ordering_fields = ['numero_de_cargo', 'fecha_creacion']

    def get_queryset(self):
        queryset = Cargo.objects.select_related(
            'tipo_cargo',
            'cargo_departamento__departamento',
            'cargo_departamento__asignatura',
            'resolucion_oficializacion',
        ).all()

        user = self.request.user
        if user.is_authenticated and not user.is_superuser:
            es_admin = (
                getattr(user, 'rol', None)
                and getattr(user.rol, 'descripcion', '') == 'ADMINISTRADOR'
            )
            if not es_admin:
                deptos_ids = list(
                    user.departamentos_administrados.values_list('id', flat=True)
                )
                if deptos_ids:
                    queryset = queryset.filter(
                        cargo_departamento__departamento_id__in=deptos_ids)

        params = self.request.query_params
        if params.get('show_all', False):
            return queryset
        if 'estado' in params:
            return queryset
        return queryset.filter(estado='1')

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.estado = '0'
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ---------- vincular a un CargoDepartamento ----------

    @action(detail=True, methods=['post'], url_path='vincular')
    def vincular(self, request, pk=None):
        """Vincula el Cargo (plata) a un CargoDepartamento.

        Body:
          - cargo_departamento: id (obligatorio)
          - resolucion_oficializacion: id (opcional)
        """
        cargo = self.get_object()

        cargo_dep_id = request.data.get('cargo_departamento')
        if not cargo_dep_id:
            return Response(
                {'detail': 'cargo_departamento es obligatorio.'},
                status=status.HTTP_400_BAD_REQUEST)

        try:
            cargo_dep = CargoDepartamento.objects.get(id=cargo_dep_id)
        except CargoDepartamento.DoesNotExist:
            return Response(
                {'detail': 'CargoDepartamento no existe.'},
                status=status.HTTP_400_BAD_REQUEST)

        if hasattr(cargo_dep, 'cargo') and cargo_dep.cargo and cargo_dep.cargo.id != cargo.id:
            return Response(
                {'detail': 'Ese Cargo de Departamento ya tiene otro cargo vinculado.'},
                status=status.HTTP_400_BAD_REQUEST)

        if cargo_dep.tipo_cargo_id and cargo.tipo_cargo_id != cargo_dep.tipo_cargo_id:
            tdep = cargo_dep.tipo_cargo
            tcar = cargo.tipo_cargo
            return Response({
                'detail': (
                    f'Los tipos no coinciden. El Cargo de Departamento es '
                    f'"{tdep.descripcion} ({tdep.dedicacion})" y el cargo '
                    f'{("es " + tcar.descripcion + " (" + tcar.dedicacion + ")") if tcar else "no tiene tipo"}.'
                ),
            }, status=status.HTTP_400_BAD_REQUEST)

        resolucion_id = request.data.get('resolucion_oficializacion')
        if resolucion_id:
            try:
                cargo.resolucion_oficializacion = Resolucion.objects.get(id=resolucion_id)
            except Resolucion.DoesNotExist:
                return Response(
                    {'detail': 'Resolución no existe.'},
                    status=status.HTTP_400_BAD_REQUEST)

        cargo.cargo_departamento = cargo_dep
        cargo.save()
        return Response(CargoSerializer(cargo).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='desvincular')
    def desvincular(self, request, pk=None):
        cargo = self.get_object()
        cargo.cargo_departamento = None
        cargo.save()
        return Response(CargoSerializer(cargo).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='sin-vincular')
    def sin_vincular(self, request):
        qs = self.get_queryset().filter(cargo_departamento__isnull=True, estado='1')
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(self.get_serializer(page, many=True).data)
        return Response(self.get_serializer(qs, many=True).data)
