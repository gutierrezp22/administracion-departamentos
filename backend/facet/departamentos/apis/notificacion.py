from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings

from django.utils.timezone import now
from ..models import Notificacion, Persona
from ..serializers import NotificacionSerializer

class NotificacionViewSet(viewsets.ModelViewSet):
    queryset = Notificacion.objects.all().order_by('-fecha_creacion')
    serializer_class = NotificacionSerializer
    permission_classes = [AllowAny]

    # def get_queryset(self):
    #     """Filtrar notificaciones por usuario."""
    #     return Notificacion.objects.filter(persona=self.request.user.persona)

    @action(detail=True, methods=['patch'])
    def marcar_leida(self, request, pk=None):
        """Marcar una notificación como leída."""
        notificacion = self.get_object()
        notificacion.leido = True
        notificacion.save()
        return Response({"message": "Notificación marcada como leída"}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='crear_notificacion')
    def crear_notificacion(self, request):
        """Crear una nueva notificación manualmente y enviar un correo."""
        persona_id = request.data.get('persona_id')
        mensaje = request.data.get('mensaje')

        if not persona_id or not mensaje:
            return Response({"error": "Faltan datos"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            persona = Persona.objects.get(id=persona_id)
            if not persona.email:
                return Response({"error": "La persona no tiene un correo registrado"}, status=status.HTTP_400_BAD_REQUEST)

            # Crear notificación
            notificacion = Notificacion.objects.create(
                persona=persona,
                mensaje=mensaje
            )

            # Enviar correo
            send_mail(
                subject="Notificación de Administración",
                message=mensaje,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[persona.email],
                fail_silently=False,
            )

            return Response(NotificacionSerializer(notificacion).data, status=status.HTTP_201_CREATED)

        except Persona.DoesNotExist:
            return Response({"error": "Persona no encontrada"}, status=status.HTTP_404_NOT_FOUND)
    
    @shared_task
    def verificar_documentaciones():
        """Verifica si algún jefe de departamento debe renovar su documentación en 30 días y genera notificaciones."""
        fecha_limite = now() + timedelta(days=30)
        jefes_departamentos = JefeDepartamento.objects.filter(fecha_de_fin__lte=fecha_limite, fecha_de_fin__isnull=False)

        for jefe_departamento in jefes_departamentos:
            persona = jefe_departamento.jefe.persona
            mensaje = f"Hola {persona.nombre}, su documentación vence el {jefe_departamento.fecha_de_fin}. Por favor, renueve a tiempo."

            # Crear notificación en la base de datos
            Notificacion.objects.create(persona=persona, mensaje=mensaje)

            # Enviar correo al jefe
            if persona.email:
                send_mail(
                    'Recordatorio de Renovación de Documentación',
                    mensaje,
                    settings.DEFAULT_FROM_EMAIL,
                    [persona.email],
                    fail_silently=False,
                )
