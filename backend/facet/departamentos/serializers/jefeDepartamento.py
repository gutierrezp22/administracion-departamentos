from rest_framework import serializers
from ..models import JefeDepartamento, Jefe, Departamento, Resolucion
from .jefe import JefeSerializer
from .resolucion import ResolucionSerializer
from .departamento import DepartamentoSerializer

class JefeDepartamentoSerializer(serializers.ModelSerializer):
    """Serializer general para JefeDepartamento, incluyendo el campo 'notificado'."""
    
    class Meta:
        model = JefeDepartamento
        fields = '__all__'

class JefeDepartamentoCreateSerializer(serializers.ModelSerializer):
    """Serializer para la creación de un JefeDepartamento, asegurando relaciones correctas."""
    
    jefe = serializers.PrimaryKeyRelatedField(queryset=Jefe.objects.all())
    departamento = serializers.PrimaryKeyRelatedField(queryset=Departamento.objects.all())
    resolucion = serializers.PrimaryKeyRelatedField(queryset=Resolucion.objects.all())
    notificado = serializers.BooleanField(default=False) 

    class Meta:
        model = JefeDepartamento
        fields = '__all__'

class JefeDepartamentoDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado que anida las relaciones en lugar de usar IDs."""
    
    jefe = JefeSerializer()
    departamento = DepartamentoSerializer()
    resolucion = ResolucionSerializer()
    notificado = serializers.BooleanField()

    class Meta:
        model = JefeDepartamento
        fields = '__all__'
