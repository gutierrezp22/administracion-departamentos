from .area import AreaViewSet
from .asignatura import AsignaturaViewSet
from .carrera import CarreraViewSet
from .departamento import DepartamentoViewSet
from .docente import DocenteViewSet
from .resolucion import ResolucionViewSet
from .persona import PersonaViewSet
from .jefe import JefeViewSet
from .director import DirectorViewSet
from .noDocente import NoDocenteViewSet
from .jefeDepartamento import JefeDepartamentoViewSet
from .asignaturaCarrera import AsignaturaCarreraViewSet
from .asignaturaDocente import AsignaturaDocenteViewSet
from .directorCarrera import DirectorCarreraViewSet
from .tipoTitulo import TipoTituloViewSet
from .notificacion import NotificacionViewSet
from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100
