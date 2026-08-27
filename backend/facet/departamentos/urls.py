from django.urls import include, path
from rest_framework import routers
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.documentation import include_docs_urls
# from .export.departamento import DepartamentoExportPDF, DepartamentoExportExcel
from .apis import *

router = routers.DefaultRouter()
router.register(r'area', AreaViewSet)
router.register(r'asignatura', AsignaturaViewSet)
router.register(r'asignatura-carrera', AsignaturaCarreraViewSet)
router.register(r'asignatura-docente', AsignaturaDocenteViewSet)
router.register(r'carrera', CarreraViewSet)
router.register(r'departamento', DepartamentoViewSet)
router.register(r'director', DirectorViewSet)
router.register(r'director-carrera', DirectorCarreraViewSet)
router.register(r'persona', PersonaViewSet)
router.register(r'docente', DocenteViewSet)
router.register(r'jefe', JefeViewSet)
router.register(r'resolucion', ResolucionViewSet)
router.register(r'jefe-departamento', JefeDepartamentoViewSet)
router.register(r'nodocente', NoDocenteViewSet)
router.register(r'tipo-titulo', TipoTituloViewSet)
router.register(r'notificacion', NotificacionViewSet)
router.register(r'tipo-cargo', TipoCargoViewSet)
router.register(r'cargo-departamento', CargoDepartamentoViewSet)
router.register(r'cargo', CargoViewSet)
router.register(r'cargo-historial', CargoHistorialViewSet)
router.register(r'operacion-cargo', OperacionCargoViewSet)
router.register(r'designacion', DesignacionViewSet)
router.register(r'seguimiento', SeguimientoViewSet)
router.register(r'licencia', LicenciaViewSet)
router.register(r'asignacion-funcion', AsignacionFuncionViewSet)
router.register(r'estadistica-asignatura', EstadisticaAsignaturaViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('reporte-planta/', ReportePlantaView.as_view(), name='reporte_planta'),
    path('docs/', include_docs_urls(title="FACET API")),
    # path('export/excel/departamentos/', DepartamentoExportExcel.as_view(), name='export_excel_departamentos'),
    # path('export/pdf/departamentos/', DepartamentoExportPDF.as_view(), name='export_pdf_departamentos'),
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)