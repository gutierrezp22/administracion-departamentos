from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.utils.timezone import now
from datetime import timedelta
from .models import Notificacion, Persona, JefeDepartamento, AsignaturaDocente
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def enviar_email_notificacion_task(self, persona_id, mensaje, subject="Notificación - Renovación de jefatura"):
    """
    Tarea asíncrona para enviar notificaciones por email a jefes de departamento
    """
    try:
        persona = Persona.objects.get(id=persona_id)
        
        if not persona.email:
            logger.error(f"Persona {persona_id} no tiene email registrado")
            return {"error": "La persona no tiene un correo registrado"}

        # Crear notificación en la base de datos
        notificacion = Notificacion.objects.create(
            persona=persona,
            mensaje=mensaje
        )

        # Enviar correo
        send_mail(
            subject=subject,
            message=mensaje,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[persona.email],
            fail_silently=False,
        )

        # Marcar como notificado
        try:
            jefe_departamento = JefeDepartamento.objects.get(jefe__persona__id=persona_id)
            jefe_departamento.notificado = True
            jefe_departamento.save()
        except JefeDepartamento.DoesNotExist:
            logger.warning(f"No se encontró JefeDepartamento para persona {persona_id}")

        logger.info(f"Email enviado exitosamente a {persona.email}")
        return {
            "success": True,
            "email": persona.email,
            "notificacion_id": notificacion.id
        }

    except Persona.DoesNotExist:
        logger.error(f"Persona {persona_id} no encontrada")
        return {"error": "Persona no encontrada"}
    
    except Exception as exc:
        logger.error(f"Error enviando email: {str(exc)}")
        # Reintento automático
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=60, exc=exc)
        return {"error": f"Error después de {self.max_retries} intentos: {str(exc)}"}


@shared_task(bind=True, max_retries=3)
def enviar_email_asignatura_task(self, persona_id, mensaje, subject="Notificación - Renovación de cargo"):
    """
    Tarea asíncrona para enviar notificaciones por email a docentes de asignatura
    """
    try:
        persona = Persona.objects.get(id=persona_id)
        
        if not persona.email:
            logger.error(f"Persona {persona_id} no tiene email registrado")
            return {"error": "La persona no tiene un correo registrado"}

        # Crear notificación en la base de datos
        notificacion = Notificacion.objects.create(
            persona=persona,
            mensaje=mensaje
        )

        # Enviar correo
        send_mail(
            subject=subject,
            message=mensaje,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[persona.email],
            fail_silently=False,
        )

        # Marcar como notificado
        try:
            asignatura_docente = AsignaturaDocente.objects.get(docente__persona__id=persona_id)
            asignatura_docente.notificado = True
            asignatura_docente.save()
        except AsignaturaDocente.DoesNotExist:
            logger.warning(f"No se encontró AsignaturaDocente para persona {persona_id}")

        logger.info(f"Email enviado exitosamente a {persona.email}")
        return {
            "success": True,
            "email": persona.email,
            "notificacion_id": notificacion.id
        }

    except Persona.DoesNotExist:
        logger.error(f"Persona {persona_id} no encontrada")
        return {"error": "Persona no encontrada"}
    
    except Exception as exc:
        logger.error(f"Error enviando email: {str(exc)}")
        # Reintento automático
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=60, exc=exc)
        return {"error": f"Error después de {self.max_retries} intentos: {str(exc)}"}


@shared_task
def verificar_documentaciones_task():
    """
    Tarea programada para verificar vencimientos de documentaciones
    Se ejecuta diariamente para detectar documentaciones que vencen en 30 días
    """
    try:
        fecha_limite = now() + timedelta(days=30)
        jefes_departamentos = JefeDepartamento.objects.filter(
            fecha_de_fin__lte=fecha_limite.date(),
            fecha_de_fin__isnull=False,
            estado=1  # Solo activos
        )

        emails_enviados = 0
        
        for jefe_departamento in jefes_departamentos:
            persona = jefe_departamento.jefe.persona
            
            # Evitar enviar múltiples notificaciones para la misma persona
            if jefe_departamento.notificado:
                continue
                
            mensaje = f"""
Estimado/a {persona.nombre} {persona.apellido},

Le informamos que su cargo como jefe/a del departamento {jefe_departamento.departamento.nombre} 
vence el {jefe_departamento.fecha_de_fin.strftime('%d/%m/%Y')}.

Para renovar su cargo, debe acercarse al área de Personal con la documentación necesaria.

Gracias por su atención.

Área de Personal
            """.strip()

            # Enviar notificación de forma asíncrona
            enviar_email_notificacion_task.delay(
                persona_id=persona.id,
                mensaje=mensaje,
                subject="Recordatorio de Renovación de Cargo - Próximo Vencimiento"
            )
            
            emails_enviados += 1

        logger.info(f"Proceso de verificación completado. {emails_enviados} notificaciones programadas.")
        return {"success": True, "emails_programados": emails_enviados}

    except Exception as exc:
        logger.error(f"Error en verificación de documentaciones: {str(exc)}")
        return {"error": str(exc)}


@shared_task
def limpiar_notificaciones_antiguas():
    """
    Tarea para limpiar notificaciones antiguas (más de 6 meses)
    """
    try:
        fecha_limite = now() - timedelta(days=180)
        notificaciones_eliminadas = Notificacion.objects.filter(
            fecha_creacion__lt=fecha_limite
        ).delete()[0]
        
        logger.info(f"Eliminadas {notificaciones_eliminadas} notificaciones antiguas")
        return {"success": True, "eliminadas": notificaciones_eliminadas}
        
    except Exception as exc:
        logger.error(f"Error limpiando notificaciones: {str(exc)}")
        return {"error": str(exc)} 