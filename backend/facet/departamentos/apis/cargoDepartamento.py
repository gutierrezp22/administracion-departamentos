from decimal import Decimal
from datetime import date

from django.core.exceptions import ValidationError
from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend

from ..models import CargoDepartamento, Cargo, TipoCargo, OperacionCargo
from ..serializers import (
    CargoDepartamentoSerializer, CargoSerializer,
    CargoHistorialDetailSerializer, OperacionCargoSerializer,
)


# ---------- helpers de combinatoria ----------

MAX_PIEZAS_DESCOMP = 4
MAX_RESULTADOS = 50


def _enumerar_combinaciones(objetivo: Decimal, tipos: list, max_piezas: int = MAX_PIEZAS_DESCOMP):
    """Backtracking: devuelve combinaciones de TipoCargo (con repetición) cuya
    suma de puntajes sea exactamente `objetivo`, usando hasta `max_piezas`.
    """
    resultados = []

    def backtrack(idx_min, restante, piezas):
        if len(resultados) >= MAX_RESULTADOS:
            return
        if restante == Decimal('0'):
            resultados.append(list(piezas))
            return
        if restante < Decimal('0') or len(piezas) >= max_piezas:
            return
        for i in range(idx_min, len(tipos)):
            t = tipos[i]
            if t['puntaje'] > restante:
                continue
            piezas.append(t)
            backtrack(i, restante - t['puntaje'], piezas)
            piezas.pop()
            if len(resultados) >= MAX_RESULTADOS:
                return

    backtrack(0, objetivo, [])
    return resultados


def _tipos_con_puntaje():
    qs = TipoCargo.objects.filter(estado='1', puntaje__isnull=False).order_by('-puntaje')
    return [
        {
            'id': t.id,
            'sigla': t.sigla,
            'descripcion': t.descripcion,
            'dedicacion': t.dedicacion,
            'puntaje': t.puntaje,
        }
        for t in qs
    ]


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class CargoDepartamentoViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = CargoDepartamento.objects.all()
    serializer_class = CargoDepartamentoSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        'estado': ['exact'],
        'departamento': ['exact'],
        'asignatura': ['exact', 'isnull'],
        'cargo': ['isnull'],
        'tipo_cargo': ['exact'],
        'tipo_cargo__sigla': ['exact'],
        'tipo_cargo__dedicacion': ['exact'],
        'tipo_cargo__descripcion': ['exact', 'icontains'],
    }
    search_fields = ['descripcion', 'departamento__nombre', 'asignatura__nombre']
    ordering_fields = ['descripcion', 'departamento', 'fecha_creacion']

    def get_queryset(self):
        queryset = CargoDepartamento.objects.select_related(
            'departamento', 'asignatura', 'tipo_cargo',
        ).prefetch_related('cargo__tipo_cargo').all()

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
                    queryset = queryset.filter(departamento_id__in=deptos_ids)

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

    # ---------- vincular / desvincular Cargo (plata) ----------

    @action(detail=True, methods=['post'], url_path='vincular-cargo')
    def vincular_cargo(self, request, pk=None):
        """Vincula un Cargo (plata) a este CargoDepartamento (1:1)."""
        cargo_dep = self.get_object()
        cargo_id = request.data.get('cargo')
        if not cargo_id:
            return Response(
                {'detail': 'El cargo es obligatorio.'},
                status=status.HTTP_400_BAD_REQUEST)

        try:
            cargo = Cargo.objects.get(id=cargo_id)
        except Cargo.DoesNotExist:
            return Response(
                {'detail': 'Cargo no existe.'},
                status=status.HTTP_400_BAD_REQUEST)

        if cargo.cargo_departamento_id and cargo.cargo_departamento_id != cargo_dep.id:
            return Response(
                {'detail': 'El cargo ya está vinculado a otro Cargo de Departamento. Desvinculá primero.'},
                status=status.HTTP_400_BAD_REQUEST)

        if hasattr(cargo_dep, 'cargo') and cargo_dep.cargo and cargo_dep.cargo.id != cargo.id:
            return Response(
                {'detail': 'Este Cargo de Departamento ya tiene otro cargo vinculado.'},
                status=status.HTTP_400_BAD_REQUEST)

        # Validar tipos: si el Cargo de Departamento define un tipo, el Cargo
        # (plata) debe coincidir.
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

        cargo.cargo_departamento = cargo_dep
        cargo.save()
        return Response(CargoDepartamentoSerializer(cargo_dep).data,
                        status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='desvincular-cargo')
    def desvincular_cargo(self, request, pk=None):
        cargo_dep = self.get_object()
        cargo = getattr(cargo_dep, 'cargo', None)
        if not cargo:
            return Response(
                {'detail': 'Este Cargo de Departamento no tiene cargo vinculado.'},
                status=status.HTTP_400_BAD_REQUEST)
        cargo.cargo_departamento = None
        cargo.save()
        return Response(CargoDepartamentoSerializer(cargo_dep).data,
                        status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='cargos-disponibles')
    def cargos_disponibles(self, request):
        """Cargos (plata) activos sin Cargo de Departamento asignado.

        Query params:
          - tipo_cargo: id (opcional) — filtra por tipo coincidente.
        """
        qs = Cargo.objects.select_related('tipo_cargo').filter(
            cargo_departamento__isnull=True, estado='1',
        )
        tipo_cargo_id = request.query_params.get('tipo_cargo')
        if tipo_cargo_id:
            qs = qs.filter(tipo_cargo_id=tipo_cargo_id)
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(CargoSerializer(page, many=True).data)
        return Response(CargoSerializer(qs, many=True).data)

    # ---------- historial (ocupantes + operaciones) ----------

    @action(detail=True, methods=['get'], url_path='historial')
    def historial(self, request, pk=None):
        cargo_dep = self.get_object()
        ocupaciones_qs = cargo_dep.historial.select_related(
            'docente__persona', 'no_docente__persona', 'resolucion'
        ).filter(estado='1').order_by('fecha_inicio')
        ocupaciones = CargoHistorialDetailSerializer(ocupaciones_qs, many=True).data

        ops_origen = cargo_dep.operaciones_como_origen.prefetch_related(
            'cargos_origen__tipo_cargo', 'cargos_destino__tipo_cargo'
        ).filter(estado='1').order_by('-fecha')
        ops_destino = cargo_dep.operaciones_como_destino.prefetch_related(
            'cargos_origen__tipo_cargo', 'cargos_destino__tipo_cargo'
        ).filter(estado='1').order_by('-fecha')

        return Response({
            'cargo_departamento': CargoDepartamentoSerializer(cargo_dep).data,
            'ocupaciones': ocupaciones,
            'nacio_de': OperacionCargoSerializer(ops_destino, many=True).data,
            'finalizo_en': OperacionCargoSerializer(ops_origen, many=True).data,
        })

    # ---------- sugerir descomposiciones ----------

    @action(detail=True, methods=['get'], url_path='descomposiciones')
    def descomposiciones(self, request, pk=None):
        cargo_dep = self.get_object()
        if cargo_dep.puntaje is None:
            return Response(
                {'detail': 'Este Cargo de Departamento no tiene puntaje asignado.'},
                status=status.HTTP_400_BAD_REQUEST)

        try:
            max_piezas = int(request.query_params.get('max_piezas', MAX_PIEZAS_DESCOMP))
        except ValueError:
            max_piezas = MAX_PIEZAS_DESCOMP
        max_piezas = max(2, min(max_piezas, 6))

        tipos = _tipos_con_puntaje()
        combinaciones = _enumerar_combinaciones(cargo_dep.puntaje, tipos, max_piezas=max_piezas)

        return Response({
            'cargo_departamento_id': cargo_dep.id,
            'descripcion': cargo_dep.descripcion,
            'puntaje_objetivo': cargo_dep.puntaje,
            'max_piezas': max_piezas,
            'total_combinaciones': len(combinaciones),
            'combinaciones': [
                {
                    'puntaje_total': sum((t['puntaje'] for t in combo), Decimal('0')),
                    'piezas': combo,
                }
                for combo in combinaciones
            ],
        })

    # ---------- ejecutar descomposición ----------

    @action(detail=True, methods=['post'], url_path='descomponer')
    def descomponer(self, request, pk=None):
        """Descompone un Cargo de Departamento en N nuevos.

        Body:
          - tipos: [tipo_cargo_id, ...]  (al menos 2)
          - fecha: YYYY-MM-DD (opcional)
          - resolucion: id (opcional)
          - observaciones: string (opcional)
        """
        cargo_dep = self.get_object()
        if cargo_dep.estado != '1':
            return Response(
                {'detail': 'El Cargo de Departamento no está activo.'},
                status=status.HTTP_400_BAD_REQUEST)
        if cargo_dep.puntaje is None:
            return Response(
                {'detail': 'El Cargo de Departamento no tiene puntaje.'},
                status=status.HTTP_400_BAD_REQUEST)

        tipos_ids = request.data.get('tipos', [])
        if not isinstance(tipos_ids, list) or len(tipos_ids) < 2:
            return Response(
                {'detail': 'Debe indicar al menos 2 tipos hijos.'},
                status=status.HTTP_400_BAD_REQUEST)

        tipos = list(TipoCargo.objects.filter(id__in=tipos_ids, estado='1'))
        tipos_por_id = {t.id: t for t in tipos}
        try:
            tipos_ordenados = [tipos_por_id[int(tid)] for tid in tipos_ids]
        except (KeyError, ValueError):
            return Response(
                {'detail': 'Algún tipo_cargo no existe o no está activo.'},
                status=status.HTTP_400_BAD_REQUEST)

        for t in tipos_ordenados:
            if t.puntaje is None:
                return Response(
                    {'detail': f'Tipo "{t}" no tiene puntaje y no puede usarse.'},
                    status=status.HTTP_400_BAD_REQUEST)

        suma = sum((t.puntaje for t in tipos_ordenados), Decimal('0'))
        if suma != cargo_dep.puntaje:
            return Response(
                {'detail': f'Suma de puntajes ({suma}) no coincide con el del Cargo de Departamento ({cargo_dep.puntaje}).'},
                status=status.HTTP_400_BAD_REQUEST)

        fecha = request.data.get('fecha') or date.today().isoformat()
        resolucion_id = request.data.get('resolucion')
        observaciones = request.data.get('observaciones', '')

        with transaction.atomic():
            nuevos = []
            for t in tipos_ordenados:
                cd = CargoDepartamento.objects.create(
                    departamento=cargo_dep.departamento,
                    asignatura=cargo_dep.asignatura,
                    tipo_cargo=t,
                    descripcion='',
                    estado='1',
                )
                nuevos.append(cd)

            op = OperacionCargo.objects.create(
                tipo='descomposicion',
                fecha=fecha,
                resolucion_id=resolucion_id,
                observaciones=observaciones,
                estado='1',
            )
            op.cargos_origen.add(cargo_dep)
            op.cargos_destino.add(*nuevos)

            # Desvincular el Cargo (plata) del origen, queda disponible.
            cargo_plata = getattr(cargo_dep, 'cargo', None)
            if cargo_plata:
                cargo_plata.cargo_departamento = None
                cargo_plata.save()

            cargo_dep.estado = '0'
            cargo_dep.save()

        return Response(
            OperacionCargoSerializer(op).data,
            status=status.HTTP_201_CREATED)

    # ---------- ejecutar combinación ----------

    @action(detail=False, methods=['post'], url_path='combinar')
    def combinar(self, request):
        """Combina N Cargos de Departamento en uno nuevo.

        Body:
          - cargos_departamento: [id, ...]  (al menos 2, todos del mismo depto)
          - tipo_cargo_destino: id
          - fecha, resolucion, observaciones (opcionales)
        """
        ids = request.data.get('cargos_departamento', [])
        tipo_destino_id = request.data.get('tipo_cargo_destino')

        if not isinstance(ids, list) or len(ids) < 2:
            return Response(
                {'detail': 'Debe indicar al menos 2 Cargos de Departamento.'},
                status=status.HTTP_400_BAD_REQUEST)
        if len(set(ids)) != len(ids):
            return Response(
                {'detail': 'No puede repetir el mismo Cargo de Departamento.'},
                status=status.HTTP_400_BAD_REQUEST)
        if not tipo_destino_id:
            return Response(
                {'detail': 'Falta tipo_cargo_destino.'},
                status=status.HTTP_400_BAD_REQUEST)

        cds = list(CargoDepartamento.objects.select_related(
            'tipo_cargo', 'departamento').filter(id__in=ids))
        if len(cds) != len(ids):
            return Response(
                {'detail': 'Algún Cargo de Departamento no existe.'},
                status=status.HTTP_400_BAD_REQUEST)

        for cd in cds:
            if cd.estado != '1':
                return Response(
                    {'detail': f'"{cd}" no está activo.'},
                    status=status.HTTP_400_BAD_REQUEST)
            if cd.puntaje is None:
                return Response(
                    {'detail': f'"{cd}" no tiene puntaje.'},
                    status=status.HTTP_400_BAD_REQUEST)

        deptos = {cd.departamento_id for cd in cds}
        if len(deptos) != 1:
            return Response(
                {'detail': 'Los Cargos de Departamento a combinar deben ser del mismo departamento.'},
                status=status.HTTP_400_BAD_REQUEST)

        try:
            tipo_destino = TipoCargo.objects.get(id=tipo_destino_id, estado='1')
        except TipoCargo.DoesNotExist:
            return Response(
                {'detail': 'tipo_cargo_destino no existe o no está activo.'},
                status=status.HTTP_400_BAD_REQUEST)
        if tipo_destino.puntaje is None:
            return Response(
                {'detail': 'tipo_cargo_destino no tiene puntaje.'},
                status=status.HTTP_400_BAD_REQUEST)

        suma = sum((cd.puntaje for cd in cds), Decimal('0'))
        if suma != tipo_destino.puntaje:
            return Response(
                {'detail': f'Suma de puntajes ({suma}) no coincide con el puntaje destino ({tipo_destino.puntaje}).'},
                status=status.HTTP_400_BAD_REQUEST)

        fecha = request.data.get('fecha') or date.today().isoformat()
        resolucion_id = request.data.get('resolucion')
        observaciones = request.data.get('observaciones', '')

        with transaction.atomic():
            nuevo = CargoDepartamento.objects.create(
                departamento=cds[0].departamento,
                tipo_cargo=tipo_destino,
                descripcion='',
                estado='1',
            )
            op = OperacionCargo.objects.create(
                tipo='combinacion',
                fecha=fecha,
                resolucion_id=resolucion_id,
                observaciones=observaciones,
                estado='1',
            )
            op.cargos_origen.add(*cds)
            op.cargos_destino.add(nuevo)

            for cd in cds:
                cargo_plata = getattr(cd, 'cargo', None)
                if cargo_plata:
                    cargo_plata.cargo_departamento = None
                    cargo_plata.save()
                cd.estado = '0'
                cd.save()

        return Response(
            OperacionCargoSerializer(op).data,
            status=status.HTTP_201_CREATED)

    # ---------- ejecutar renovación ----------

    @action(detail=True, methods=['post'], url_path='renovar')
    def renovar(self, request, pk=None):
        """Renueva un Cargo de Departamento: crea uno nuevo del mismo tipo y
        marca el original como inactivo."""
        cargo_dep = self.get_object()
        if cargo_dep.estado != '1':
            return Response(
                {'detail': 'El Cargo de Departamento no está activo.'},
                status=status.HTTP_400_BAD_REQUEST)

        fecha = request.data.get('fecha') or date.today().isoformat()
        resolucion_id = request.data.get('resolucion')
        observaciones = request.data.get('observaciones', '')

        with transaction.atomic():
            nuevo = CargoDepartamento.objects.create(
                departamento=cargo_dep.departamento,
                asignatura=cargo_dep.asignatura,
                tipo_cargo=cargo_dep.tipo_cargo,
                descripcion=cargo_dep.descripcion,
                estado='1',
            )
            op = OperacionCargo.objects.create(
                tipo='renovacion',
                fecha=fecha,
                resolucion_id=resolucion_id,
                observaciones=observaciones,
                estado='1',
            )
            op.cargos_origen.add(cargo_dep)
            op.cargos_destino.add(nuevo)

            cargo_plata = getattr(cargo_dep, 'cargo', None)
            if cargo_plata:
                cargo_plata.cargo_departamento = None
                cargo_plata.save()

            cargo_dep.estado = '0'
            cargo_dep.save()

        return Response(
            OperacionCargoSerializer(op).data,
            status=status.HTTP_201_CREATED)

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except ValidationError as e:
            return Response(e.message_dict if hasattr(e, 'message_dict') else {'detail': e.messages},
                            status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        try:
            return super().update(request, *args, **kwargs)
        except ValidationError as e:
            return Response(e.message_dict if hasattr(e, 'message_dict') else {'detail': e.messages},
                            status=status.HTTP_400_BAD_REQUEST)
