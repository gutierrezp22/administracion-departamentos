from django.contrib.auth.models import Group
from rest_framework import viewsets, permissions
from rest_framework import status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from ..serializers import  UserSerializer,GroupSerializer, MyTokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.pagination import LimitOffsetPagination
from django.contrib.auth import get_user_model
from rest_framework.permissions import AllowAny

User = get_user_model()

from rest_framework.views import APIView
from django.conf import settings

# Formato con viewsets
class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint que permite ver o editar usuarios.
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated] # Se pueden ver solo si el usuario esta autenticado
    pagination_class = LimitOffsetPagination
    
    def update(self,request,pk=None,partial=False):
        from django.contrib.auth.hashers import make_password
        from ..models import User
        from roles.models import Rol
        
        try: 
            data = request.data
            user = User.objects.get(pk=pk)
            if(data.get('apellido') is not None):
                user.apellido= data['apellido']
            if(data.get('nombre') is not None):
                user.nombre= data['nombre']
            if(data.get('legajo') is not None):
                user.legajo= data['legajo']
            if(data.get('documento') is not None):
                user.documento= data['documento']
            if(data.get('email') is not None):
                user.email= data['email']
            if(data.get('rol') is not None):
                user.rol= Rol.objects.get(id=data['rol'])
            if(data.get('is_active') is not None):
                user.is_active = data['is_active']
                if(data['is_active']):
                    user.set_password(str(user.documento))
                    user.has_changed_password = False
            user.save()
            return Response(status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error':str(e)},status=status.HTTP_400_BAD_REQUEST)
    
    def list(self, request):
        import ast 
        from django.db.models import Q
        queryset = self.queryset
        # Filtros por query params estándar
        email = request.query_params.get('email__icontains')
        if email:
            queryset = queryset.filter(email__icontains=email)
        apellido = request.query_params.get('apellido__icontains')
        if apellido:
            queryset = queryset.filter(apellido__icontains=apellido)
        nombre = request.query_params.get('nombre__icontains')
        if nombre:
            queryset = queryset.filter(nombre__icontains=nombre)
        legajo = request.query_params.get('legajo__icontains')
        if legajo:
            queryset = queryset.filter(legajo__icontains=legajo)
        documento = request.query_params.get('documento__icontains')
        if documento:
            queryset = queryset.filter(documento__icontains=documento)
        rol = request.query_params.get('rol')
        if rol:
            queryset = queryset.filter(rol__id=rol)
        is_active = request.query_params.get('is_active')
        if is_active is not None:
            if is_active.lower() == 'true':
                queryset = queryset.filter(is_active=True)
            elif is_active.lower() == 'false':
                queryset = queryset.filter(is_active=False)
        # Filtros legacy por 'filters' (mantener compatibilidad)
        if request.query_params.get('filters'):
            filtros = ast.literal_eval(request.query_params.get('filters'))
            for filtro in filtros:
                if filtro['id'] == 'email':
                    queryset = queryset.filter(email__icontains=filtro['value'])
                if filtro['id'] == 'apellido':
                    queryset = queryset.filter(apellido__icontains=filtro['value'])
                if filtro['id'] == 'nombre':
                    queryset = queryset.filter(nombre__icontains=filtro['value'])
                if filtro['id'] == 'legajo':
                    queryset = queryset.filter(legajo__icontains=filtro['value'])
                if filtro['id'] == 'documento':
                    queryset = queryset.filter(documento__icontains=filtro['value'])
                if filtro['id'] == 'rol_detalle':
                    queryset = queryset.filter(rol__descripcion__icontains=filtro['value'])
        paginator = LimitOffsetPagination()
        paginated_queryset = paginator.paginate_queryset(queryset, request)
        serializer = UserSerializer(paginated_queryset, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path=r'busquedaEmail/(?P<email>[\w.%+-]+@[\w.-]+\.\w+)', name='busquedaEmail')
    def busquedaEmail(self, request, email, *args, **kwargs):
        if (User.objects.filter(email=email).exists()):
            queryset = User.objects.get(email=email)
            serializer = self.get_serializer(queryset, many=False)
            return Response(serializer.data)
        else:
            return Response({'error': "No se encuentra el Usuario que esta buscando"}, status=status.HTTP_204_NO_CONTENT)
        

class GroupViewSet(viewsets.ModelViewSet):
    """
    API endpoint que permite ver o editar grupos de permisos.
    """
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated] # Se pueden ver solo si el usuario esta autenticado
    
class MyTokenObtainPairView(TokenObtainPairView):
    """
    Serializador del token
    """
    permission_classes = [AllowAny]  # Permite el acceso sin necesidad de autenticación

    print("entra al token")
    serializer_class = MyTokenObtainPairSerializer
   
class ValidateRecaptchaView(APIView):
    permission_classes=[permissions.AllowAny]
    def post(self,request):
        import requests
        
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        
        captcha_rs = request.data.get('recaptchaToken')
        url = "https://www.google.com/recaptcha/api/siteverify"
        
        params = {
            'secret': settings.RECAPTCHA_PRIVATE_KEY,
            'response': captcha_rs,
            'remoteip': ip
        }
        
        verify_rs = requests.get(url,params=params,verify=True)
        verify_rs = verify_rs.json()
        return Response({"isValid": verify_rs.get("success", False)})