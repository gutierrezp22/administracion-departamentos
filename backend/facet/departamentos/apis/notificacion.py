from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from django.core.mail import send_mail
from django.conf import settings
from django.utils.timezone import now
from ..models import Notificacion, Persona, JefeDepartamento, AsignaturaDocente
from ..serializers import NotificacionSerializer
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as filters
from ..tasks import enviar_email_notificacion_task, enviar_email_asignatura_task
import logging

logger = logging.getLogger(__name__)

# Configuración de paginación
class NotificacionPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

# Definir un `FilterSet` personalizado
class NotificacionFilter(filters.FilterSet):
    persona_apellido = filters.CharFilter(field_name="persona__apellido", lookup_expr="icontains")
    persona_nombre = filters.CharFilter(field_name="persona__nombre", lookup_expr="icontains")
    mensaje__icontains = filters.CharFilter(field_name="mensaje", lookup_expr="icontains")
    fecha_creacion = filters.DateFromToRangeFilter(field_name="fecha_creacion")

    class Meta:
        model = Notificacion
        fields = ['persona_apellido', 'persona_nombre', 'mensaje__icontains', 'fecha_creacion']

class NotificacionViewSet(viewsets.ModelViewSet):
    queryset = Notificacion.objects.select_related('persona').all().order_by('-fecha_creacion')  
    serializer_class = NotificacionSerializer
    permission_classes = [AllowAny]
    pagination_class = NotificacionPagination
    filter_backends = [DjangoFilterBackend]
    filterset_class = NotificacionFilter  

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())  
        return super().list(request, *args, **kwargs)
    

    @action(detail=True, methods=['patch'])
    def marcar_leida(self, request, pk=None):
        """Marcar una notificación como leída."""
        notificacion = self.get_object()
        notificacion.leido = True
        notificacion.save()
        return Response({"message": "Notificación marcada como leída"}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='crear_notificacion')
    def crear_notificacion(self, request):
        """Crear una nueva notificación manualmente y enviar un correo usando Celery."""
        persona_id = request.data.get('persona_id')
        mensaje = request.data.get('mensaje')

        if not persona_id or not mensaje:
            return Response({"error": "Faltan datos: persona_id y mensaje son requeridos"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Validar que la persona existe
            persona = Persona.objects.get(id=persona_id)
            
            # Validar que el jefe de departamento existe
            jefe_departamento = JefeDepartamento.objects.get(jefe__persona__id=persona_id)

            if not persona.email:
                return Response({"error": "La persona no tiene un correo registrado"}, status=status.HTTP_400_BAD_REQUEST)

            # 🚀 Enviar email de forma asíncrona usando Celery
            task_result = enviar_email_notificacion_task.delay(
                persona_id=persona_id,
                mensaje=mensaje
            )

            logger.info(f"Tarea de envío de email programada con ID: {task_result.id}")

            return Response({
                "message": "Notificación programada para envío",
                "task_id": task_result.id,
                "persona_email": persona.email,
                "status": "processing"
            }, status=status.HTTP_202_ACCEPTED)

        except Persona.DoesNotExist:
            return Response({"error": "Persona no encontrada"}, status=status.HTTP_404_NOT_FOUND)
        except JefeDepartamento.DoesNotExist:
            return Response({"error": "No se encontró el jefe de departamento"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error inesperado al crear notificación: {str(e)}")
            return Response({"error": "Error interno del servidor"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], url_path='crear_notificacion_asig')
    def crear_notificacion_asignatura(self, request):
        """Crear una notificación para un docente de asignatura y enviar un correo usando Celery."""
        persona_id = request.data.get('persona_id')
        mensaje = request.data.get('mensaje')

        if not persona_id or not mensaje:
            return Response({"error": "Faltan datos: persona_id y mensaje son requeridos"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Validar que la persona existe
            persona = Persona.objects.get(id=persona_id)
            
            # Validar que la asignatura del docente existe
            asignatura_docente = AsignaturaDocente.objects.get(docente__persona__id=persona_id)

            if not persona.email:
                return Response({"error": "La persona no tiene un correo registrado"}, status=status.HTTP_400_BAD_REQUEST)

            # 🚀 Enviar email de forma asíncrona usando Celery
            task_result = enviar_email_asignatura_task.delay(
                persona_id=persona_id,
                mensaje=mensaje
            )

            logger.info(f"Tarea de envío de email para asignatura programada con ID: {task_result.id}")

            return Response({
                "message": "Notificación programada para envío",
                "task_id": task_result.id,
                "persona_email": persona.email,
                "status": "processing"
            }, status=status.HTTP_202_ACCEPTED)

        except Persona.DoesNotExist:
            return Response({"error": "Persona no encontrada"}, status=status.HTTP_404_NOT_FOUND)
        except AsignaturaDocente.DoesNotExist:
            return Response({"error": "No se encontró la asignatura del docente"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error inesperado al crear notificación de asignatura: {str(e)}")
            return Response({"error": "Error interno del servidor"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], url_path='estado_tarea/(?P<task_id>[^/.]+)')
    def estado_tarea(self, request, task_id=None):
        """Consultar el estado de una tarea de Celery."""
        from celery.result import AsyncResult
        
        if not task_id:
            return Response({"error": "task_id es requerido"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            task_result = AsyncResult(task_id)
            
            response_data = {
                "task_id": task_id,
                "status": task_result.status,
                "ready": task_result.ready(),
            }
            
            if task_result.ready():
                if task_result.successful():
                    response_data["result"] = task_result.result
                else:
                    response_data["error"] = str(task_result.info)
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error consultando estado de tarea {task_id}: {str(e)}")
            return Response({"error": "Error consultando estado de la tarea"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='test_email')
    def test_email(self, request):
        """Endpoint para probar el envío de emails (solo para desarrollo)."""
        if not settings.DEBUG:
            return Response({"error": "Endpoint solo disponible en modo desarrollo"}, status=status.HTTP_403_FORBIDDEN)
        
        email = request.data.get('email')
        if not email:
            return Response({"error": "Email es requerido"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            send_mail(
                subject="Email de prueba - Sistema de Notificaciones",
                message="Este es un email de prueba para verificar la configuración del sistema.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
            
            return Response({"message": f"Email de prueba enviado a {email}"}, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error enviando email de prueba: {str(e)}")
            return Response({"error": f"Error enviando email: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
