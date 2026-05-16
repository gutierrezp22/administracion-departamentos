from decimal import Decimal
from datetime import date

from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend

from ..models import (
    Cargo, TipoCargo, OperacionCargo, CargoHistorial,
    Departamento, Asignatura, Resolucion,
)
from ..serializers import (
    CargoSerializer,
    CargoHistorialDetailSerializer,
    OperacionCargoSerializer,
    TipoCargoSerializer,
)


# ---------- helpers de combinatoria ----------

MAX_PIEZAS_DESCOMP = 4
MAX_RESULTADOS = 50


def _enumerar_combinaciones(objetivo: Decimal, tipos: list, max_piezas: int = MAX_PIEZAS_DESCOMP):
    """Backtracking: devuelve combinaciones de TipoCargo (con repetición) cuya
    suma de puntajes sea exactamente `objetivo`, usando hasta `max_piezas`.

    `tipos` es una lista de dicts {'id', 'descripcion', 'dedicacion', 'puntaje', 'sigla'}
    ordenada por puntaje descendente para podar antes.

    Devuelve lista de combinaciones; cada combinación es lista de tipos.
    Limita a MAX_RESULTADOS para no explotar.
    """
    resultados = []

    # Para que combinaciones equivalentes con distinto orden no se dupliquen,
    # exigimos índices no-decrecientes.
    def backtrack(idx_min, restante, piezas):
        if len(resultados) >= MAX_RESULTADOS:
            return
        if restante == Decimal('0'):
            resultados.append(list(piezas))
            return
        if restante < Decimal('0') or len(piezas) >= max_piezas:
            return
        # Poda: como tipos está ordenada desc, si el más grande disponible es
        # menor que restante/max_piezas restantes no llegamos.
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
    """Lista plana de TipoCargo activos con puntaje, ordenada desc."""
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


def _siguiente_numero_de_cargo():
    """Obtiene el próximo número de cargo libre (max + 1, fallback 1)."""
    ultimo = Cargo.objects.order_by('-numero_de_cargo').first()
    return (ultimo.numero_de_cargo + 1) if ultimo else 1


# ---------- ViewSet ----------

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class CargoViewSet(viewsets.ModelViewSet):
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
        'departamento': ['exact', 'isnull'],
        'asignatura': ['exact', 'isnull'],
    }
    search_fields = ['numero_de_cargo', 'tipo_cargo__descripcion', 'tipo_cargo__sigla']
    ordering_fields = ['numero_de_cargo', 'fecha_creacion']

    def get_queryset(self):
        queryset = Cargo.objects.select_related(
            'tipo_cargo', 'departamento', 'asignatura', 'resolucion_oficializacion',
        ).prefetch_related(
            'historial__docente__persona',
            'historial__no_docente__persona',
        ).all()

        # Permisos por departamento: si el usuario tiene departamentos_administrados
        # seteados y NO es admin/superuser, solo ve cargos de esos departamentos.
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
        # Filtros por fechas del historial. Como historial es 1-N usamos
        # distinct() para no duplicar el cargo si tiene varios períodos.
        params = self.request.query_params
        fecha_alta_desde = params.get('fecha_alta_desde')
        fecha_alta_hasta = params.get('fecha_alta_hasta')
        fecha_baja_desde = params.get('fecha_baja_desde')
        fecha_baja_hasta = params.get('fecha_baja_hasta')

        if fecha_alta_desde:
            queryset = queryset.filter(historial__fecha_inicio__gte=fecha_alta_desde)
        if fecha_alta_hasta:
            queryset = queryset.filter(historial__fecha_inicio__lte=fecha_alta_hasta)
        if fecha_baja_desde:
            queryset = queryset.filter(historial__fecha_fin__gte=fecha_baja_desde)
        if fecha_baja_hasta:
            queryset = queryset.filter(historial__fecha_fin__lte=fecha_baja_hasta)
        if any([fecha_alta_desde, fecha_alta_hasta, fecha_baja_desde, fecha_baja_hasta]):
            queryset = queryset.distinct()

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

    # ---------- historial completo (línea de tiempo) ----------

    @action(detail=True, methods=['get'], url_path='historial')
    def historial(self, request, pk=None):
        """Historial completo del cargo: ocupaciones + operaciones donde participó."""
        cargo = self.get_object()
        ocupaciones_qs = cargo.historial.select_related(
            'docente__persona', 'resolucion'
        ).filter(estado='1').order_by('fecha_inicio')
        ocupaciones = CargoHistorialDetailSerializer(ocupaciones_qs, many=True).data

        # Operaciones donde el cargo aparece (como origen o destino)
        ops_origen = cargo.operaciones_como_origen.prefetch_related(
            'cargos_origen__tipo_cargo', 'cargos_destino__tipo_cargo'
        ).filter(estado='1').order_by('-fecha')
        ops_destino = cargo.operaciones_como_destino.prefetch_related(
            'cargos_origen__tipo_cargo', 'cargos_destino__tipo_cargo'
        ).filter(estado='1').order_by('-fecha')

        return Response({
            'cargo': CargoSerializer(cargo).data,
            'ocupaciones': ocupaciones,
            'nacio_de': OperacionCargoSerializer(ops_destino, many=True).data,
            'finalizo_en': OperacionCargoSerializer(ops_origen, many=True).data,
        })

    # ---------- sugerir descomposiciones ----------

    @action(detail=True, methods=['get'], url_path='descomposiciones')
    def descomposiciones(self, request, pk=None):
        """Combinaciones de TipoCargo cuyos puntajes suman el del cargo dado.

        Query params:
          - max_piezas (int, default=4): tope de piezas por combinación.
        """
        cargo = self.get_object()
        if cargo.puntaje is None:
            return Response(
                {'detail': 'Este cargo no tiene puntaje asignado.'},
                status=status.HTTP_400_BAD_REQUEST)

        try:
            max_piezas = int(request.query_params.get('max_piezas', MAX_PIEZAS_DESCOMP))
        except ValueError:
            max_piezas = MAX_PIEZAS_DESCOMP
        max_piezas = max(2, min(max_piezas, 6))  # entre 2 y 6

        tipos = _tipos_con_puntaje()
        combinaciones = _enumerar_combinaciones(cargo.puntaje, tipos, max_piezas=max_piezas)

        return Response({
            'cargo_id': cargo.id,
            'numero_de_cargo': cargo.numero_de_cargo,
            'puntaje_objetivo': cargo.puntaje,
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
        """Ejecuta descomposición de un cargo en N nuevos cargos.

        Body:
          - tipos: [tipo_cargo_id, tipo_cargo_id, ...]  (ids con repetición)
          - fecha: YYYY-MM-DD (opcional, default hoy)
          - resolucion: id (opcional)
          - observaciones: string (opcional)
        """
        cargo = self.get_object()
        if cargo.estado != '1':
            return Response(
                {'detail': 'El cargo no está activo.'},
                status=status.HTTP_400_BAD_REQUEST)
        if cargo.puntaje is None:
            return Response(
                {'detail': 'El cargo no tiene puntaje.'},
                status=status.HTTP_400_BAD_REQUEST)

        tipos_ids = request.data.get('tipos', [])
        if not isinstance(tipos_ids, list) or len(tipos_ids) < 2:
            return Response(
                {'detail': 'Debe indicar al menos 2 tipos hijos.'},
                status=status.HTTP_400_BAD_REQUEST)

        tipos = list(TipoCargo.objects.filter(id__in=tipos_ids, estado='1'))
        tipos_por_id = {t.id: t for t in tipos}
        # Mantener orden y repeticiones del payload
        try:
            tipos_ordenados = [tipos_por_id[int(tid)] for tid in tipos_ids]
        except (KeyError, ValueError):
            return Response(
                {'detail': 'Algún tipo_cargo no existe o no está activo.'},
                status=status.HTTP_400_BAD_REQUEST)

        for t in tipos_ordenados:
            if t.puntaje is None:
                return Response(
                    {'detail': f'Tipo "{t}" no tiene puntaje y no puede usarse en descomposición.'},
                    status=status.HTTP_400_BAD_REQUEST)

        suma = sum((t.puntaje for t in tipos_ordenados), Decimal('0'))
        if suma != cargo.puntaje:
            return Response(
                {'detail': f'Suma de puntajes ({suma}) no coincide con puntaje del cargo ({cargo.puntaje}).'},
                status=status.HTTP_400_BAD_REQUEST)

        fecha = request.data.get('fecha') or date.today().isoformat()
        resolucion_id = request.data.get('resolucion')
        observaciones = request.data.get('observaciones', '')

        with transaction.atomic():
            siguiente = _siguiente_numero_de_cargo()
            nuevos = []
            for t in tipos_ordenados:
                c = Cargo.objects.create(
                    numero_de_cargo=siguiente,
                    tipo_cargo=t,
                    estado='1',
                )
                nuevos.append(c)
                siguiente += 1

            op = OperacionCargo.objects.create(
                tipo='descomposicion',
                fecha=fecha,
                resolucion_id=resolucion_id,
                observaciones=observaciones,
                estado='1',
            )
            op.cargos_origen.add(cargo)
            op.cargos_destino.add(*nuevos)

            cargo.estado = '0'
            cargo.save()

        return Response(
            OperacionCargoSerializer(op).data,
            status=status.HTTP_201_CREATED)

    # ---------- ejecutar combinación ----------

    @action(detail=False, methods=['post'], url_path='combinar')
    def combinar(self, request):
        """Combina N cargos en uno nuevo.

        Body:
          - cargos: [cargo_id, cargo_id, ...]  (ids únicos, al menos 2)
          - tipo_cargo_destino: id del TipoCargo del nuevo cargo
          - fecha: YYYY-MM-DD (opcional)
          - resolucion: id (opcional)
          - observaciones: string (opcional)
        """
        cargos_ids = request.data.get('cargos', [])
        tipo_destino_id = request.data.get('tipo_cargo_destino')

        if not isinstance(cargos_ids, list) or len(cargos_ids) < 2:
            return Response(
                {'detail': 'Debe indicar al menos 2 cargos a combinar.'},
                status=status.HTTP_400_BAD_REQUEST)
        if len(set(cargos_ids)) != len(cargos_ids):
            return Response(
                {'detail': 'No puede repetir el mismo cargo.'},
                status=status.HTTP_400_BAD_REQUEST)
        if not tipo_destino_id:
            return Response(
                {'detail': 'Falta tipo_cargo_destino.'},
                status=status.HTTP_400_BAD_REQUEST)

        cargos = list(Cargo.objects.select_related('tipo_cargo').filter(id__in=cargos_ids))
        if len(cargos) != len(cargos_ids):
            return Response(
                {'detail': 'Algún cargo no existe.'},
                status=status.HTTP_400_BAD_REQUEST)
        for c in cargos:
            if c.estado != '1':
                return Response(
                    {'detail': f'Cargo {c.numero_de_cargo} no está activo.'},
                    status=status.HTTP_400_BAD_REQUEST)
            if c.puntaje is None:
                return Response(
                    {'detail': f'Cargo {c.numero_de_cargo} no tiene puntaje.'},
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

        suma = sum((c.puntaje for c in cargos), Decimal('0'))
        if suma != tipo_destino.puntaje:
            return Response(
                {'detail': f'Suma de puntajes ({suma}) no coincide con el puntaje destino ({tipo_destino.puntaje}).'},
                status=status.HTTP_400_BAD_REQUEST)

        fecha = request.data.get('fecha') or date.today().isoformat()
        resolucion_id = request.data.get('resolucion')
        observaciones = request.data.get('observaciones', '')

        with transaction.atomic():
            nuevo = Cargo.objects.create(
                numero_de_cargo=_siguiente_numero_de_cargo(),
                tipo_cargo=tipo_destino,
                estado='1',
            )
            op = OperacionCargo.objects.create(
                tipo='combinacion',
                fecha=fecha,
                resolucion_id=resolucion_id,
                observaciones=observaciones,
                estado='1',
            )
            op.cargos_origen.add(*cargos)
            op.cargos_destino.add(nuevo)

            for c in cargos:
                c.estado = '0'
                c.save()

        return Response(
            OperacionCargoSerializer(op).data,
            status=status.HTTP_201_CREATED)

    # ---------- ejecutar renovación ----------

    @action(detail=True, methods=['post'], url_path='renovar')
    def renovar(self, request, pk=None):
        """Renueva un cargo: crea un nuevo cargo del mismo tipo con nuevo número
        y marca el original como inactivo. Útil para vencimientos."""
        cargo = self.get_object()
        if cargo.estado != '1':
            return Response(
                {'detail': 'El cargo no está activo.'},
                status=status.HTTP_400_BAD_REQUEST)
        if not cargo.tipo_cargo:
            return Response(
                {'detail': 'El cargo no tiene tipo asignado, no puede renovarse.'},
                status=status.HTTP_400_BAD_REQUEST)

        fecha = request.data.get('fecha') or date.today().isoformat()
        resolucion_id = request.data.get('resolucion')
        observaciones = request.data.get('observaciones', '')

        with transaction.atomic():
            nuevo = Cargo.objects.create(
                numero_de_cargo=_siguiente_numero_de_cargo(),
                tipo_cargo=cargo.tipo_cargo,
                estado='1',
            )
            op = OperacionCargo.objects.create(
                tipo='renovacion',
                fecha=fecha,
                resolucion_id=resolucion_id,
                observaciones=observaciones,
                estado='1',
            )
            op.cargos_origen.add(cargo)
            op.cargos_destino.add(nuevo)

            cargo.estado = '0'
            cargo.save()

        return Response(
            OperacionCargoSerializer(op).data,
            status=status.HTTP_201_CREATED)

    # ---------- vincular: asignar departamento / asignatura / resolución ----------

    @action(detail=True, methods=['post'], url_path='vincular')
    def vincular(self, request, pk=None):
        """Vincula un cargo a un departamento (y opcionalmente asignatura y
        resolución de oficialización).

        Body:
          - departamento: id (obligatorio)
          - asignatura: id (opcional)
          - resolucion_oficializacion: id (opcional)
        """
        cargo = self.get_object()

        departamento_id = request.data.get('departamento')
        if not departamento_id:
            return Response(
                {'detail': 'El departamento es obligatorio.'},
                status=status.HTTP_400_BAD_REQUEST)

        try:
            departamento = Departamento.objects.get(id=departamento_id)
        except Departamento.DoesNotExist:
            return Response(
                {'detail': 'Departamento no existe.'},
                status=status.HTTP_400_BAD_REQUEST)

        asignatura_id = request.data.get('asignatura')
        asignatura = None
        if asignatura_id:
            try:
                asignatura = Asignatura.objects.get(id=asignatura_id)
            except Asignatura.DoesNotExist:
                return Response(
                    {'detail': 'Asignatura no existe.'},
                    status=status.HTTP_400_BAD_REQUEST)

        resolucion_id = request.data.get('resolucion_oficializacion')
        resolucion = None
        if resolucion_id:
            try:
                resolucion = Resolucion.objects.get(id=resolucion_id)
            except Resolucion.DoesNotExist:
                return Response(
                    {'detail': 'Resolución no existe.'},
                    status=status.HTTP_400_BAD_REQUEST)

        cargo.departamento = departamento
        cargo.asignatura = asignatura
        if resolucion is not None:
            cargo.resolucion_oficializacion = resolucion
        cargo.save()

        return Response(CargoSerializer(cargo).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='desvincular')
    def desvincular(self, request, pk=None):
        """Quita el departamento / asignatura del cargo (lo deja huérfano)."""
        cargo = self.get_object()
        cargo.departamento = None
        cargo.asignatura = None
        cargo.save()
        return Response(CargoSerializer(cargo).data, status=status.HTTP_200_OK)

    # ---------- listado de cargos sin departamento ----------

    @action(detail=False, methods=['get'], url_path='sin-vincular')
    def sin_vincular(self, request):
        """Devuelve cargos activos sin departamento asignado (paginado)."""
        qs = self.get_queryset().filter(departamento__isnull=True, estado='1')
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(self.get_serializer(page, many=True).data)
        return Response(self.get_serializer(qs, many=True).data)
