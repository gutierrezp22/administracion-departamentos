# Guía de Soft Delete (Eliminación Lógica)

## ¿Qué es Soft Delete?

En lugar de eliminar físicamente los registros de la base de datos, el sistema ahora marca los objetos como "inactivos" cambiando su campo `estado` a `'0'`. Esto permite:

- **Recuperación de datos**: Los objetos eliminados pueden ser restaurados
- **Auditoría**: Mantener un historial completo de todos los registros
- **Integridad referencial**: Evitar problemas con relaciones entre modelos

## Estado de los Objetos

- **`estado = '1'`**: Objeto **ACTIVO** (visible en listados normales)
- **`estado = '0'`**: Objeto **INACTIVO** (eliminado lógicamente, oculto por defecto)

## Cambios Implementados

### ViewSets Modificados

Los siguientes ViewSets ahora implementan soft delete:

- `AsignaturaCarreraViewSet` ✅
- `CarreraViewSet` ✅
- `DepartamentoViewSet` ✅
- `PersonaViewSet` ✅
- `DocenteViewSet` ✅
- `JefeViewSet` ✅
- `DirectorViewSet` ✅
- `NoDocenteViewSet` ✅
- `ResolucionViewSet` ✅
- `JefeDepartamentoViewSet` ✅
- `DirectorCarreraViewSet` ✅
- `AsignaturaViewSet` ✅
- `AsignaturaDocenteViewSet` ✅
- `AreaViewSet` ✅

### Comportamiento por Defecto

1. **Listados normales**: Solo muestran objetos con `estado='1'` (activos)
2. **Eliminación**: Al llamar `DELETE /api/modelo/{id}/`, el objeto se marca como inactivo
3. **Filtros por estado**: Permiten ver objetos específicos según su estado

### Lógica de Filtrado Inteligente

El sistema ahora maneja tres escenarios:

#### 1. **Sin filtros** (Comportamiento por defecto)

```
GET /api/personas/
```

- Muestra **solo objetos activos** (`estado='1'`)

#### 2. **Filtro explícito por estado**

```
GET /api/personas/?estado=0    # Muestra solo inactivos
GET /api/personas/?estado=1    # Muestra solo activos
```

- El filtro automático **NO se aplica**
- Se muestran objetos según el estado especificado

#### 3. **Parámetro show_all**

```
GET /api/personas/?show_all=true
```

- Muestra **todos los objetos** (activos e inactivos)

### Parámetros Especiales

#### Ver Todos los Objetos (Incluyendo Inactivos)

```
GET /api/asignatura-carrera/?show_all=true
```

#### Filtrar por Estado Específico

```
GET /api/carreras/?estado=1  # Solo activos
GET /api/carreras/?estado=0  # Solo inactivos
```

#### Combinar Filtros

```
GET /api/personas/?estado=0&nombre__icontains=juan  # Personas inactivas con nombre "juan"
```

## Ejemplo de Uso en Frontend

### Antes (Eliminación Física)

```typescript
const handleDelete = async () => {
  await API.delete(`/api/asignatura-carrera/${id}/`);
  // El objeto se elimina permanentemente
};
```

### Ahora (Soft Delete)

```typescript
const handleDelete = async () => {
  await API.delete(`/api/asignatura-carrera/${id}/`);
  // El objeto se marca como inactivo (estado='0')
  // Desaparece de listados normales pero se puede recuperar
};
```

### Ver Objetos por Estado

```typescript
// Ver solo activos (comportamiento por defecto)
const activos = await API.get("/api/personas/");

// Ver solo eliminados/inactivos
const eliminados = await API.get("/api/personas/?estado=0");

// Ver solo activos (explícito)
const activosExplicito = await API.get("/api/personas/?estado=1");

// Ver todos (activos + inactivos)
const todos = await API.get("/api/personas/?show_all=true");
```

### Filtros Combinados

```typescript
// Buscar personas inactivas con apellido "García"
const personasInactivas = await API.get(
  "/api/personas/?estado=0&apellido__icontains=garcía"
);

// Buscar personas activas con DNI específico
const personaActiva = await API.get(
  "/api/personas/?estado=1&dni__icontains=12345"
);
```

## Funcionalidades Adicionales

### Restaurar Objetos Eliminados

Para restaurar un objeto eliminado, puedes hacer:

```typescript
const restaurarObjeto = async (id) => {
  // Primero obtener el objeto inactivo
  const response = await API.get(
    `/api/asignatura-carrera/${id}/?show_all=true`
  );
  const objeto = response.data;

  // Cambiar el estado a activo
  objeto.estado = "1";

  // Actualizar el objeto
  await API.put(`/api/asignatura-carrera/${id}/`, objeto);
};
```

### Búsquedas Avanzadas

Todos los ViewSets ahora incluyen campos de búsqueda (`search_fields`) para facilitar las consultas:

```typescript
// Buscar por nombre en asignaturas activas
const buscar = await API.get("/api/asignaturas/?search=matematica");

// Buscar en objetos inactivos
const buscarInactivos = await API.get(
  "/api/asignaturas/?estado=0&search=matematica"
);

// Buscar en todos los objetos (incluyendo inactivos)
const buscarTodos = await API.get(
  "/api/asignaturas/?search=matematica&show_all=true"
);
```

## Aplicar a Otros ViewSets

Para aplicar soft delete a otros ViewSets, sigue este patrón:

```python
from rest_framework import viewsets, filters, status
from rest_framework.response import Response

class MiModeloViewSet(viewsets.ModelViewSet):
    # Solo mostrar objetos activos por defecto
    queryset = MiModelo.objects.filter(estado='1')

    def destroy(self, request, *args, **kwargs):
        """Soft delete: cambia el estado a '0'"""
        instance = self.get_object()
        instance.estado = '0'
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_queryset(self):
        """Lógica inteligente de filtrado"""
        queryset = MiModelo.objects.all()

        # Si se especifica show_all, mostrar todos
        if self.request.query_params.get('show_all', False):
            return queryset

        # Si se filtra explícitamente por estado, no aplicar filtro automático
        if 'estado' in self.request.query_params:
            return queryset

        # Por defecto, mostrar solo activos
        return queryset.filter(estado='1')
```

## Modelos con Campo Estado

Todos los modelos con campo `estado` ahora implementan soft delete:

- AsignaturaCarrera ✅
- Carrera ✅
- Departamento ✅
- Persona ✅
- Docente ✅
- Jefe ✅
- Director ✅
- NoDocente ✅
- Resolucion ✅
- JefeDepartamento ✅
- DirectorCarrera ✅
- Asignatura ✅
- AsignaturaDocente ✅
- Area ✅

## Próximos Pasos Opcionales

1. **Crear endpoint de restauración** dedicado para reactivar objetos eliminados
2. **Actualizar frontend** para mostrar opción de "ver eliminados"
3. **Implementar papelera de reciclaje** en la interfaz
4. **Agregar permisos** para controlar quién puede ver objetos eliminados

## Ventajas del Soft Delete

1. **Recuperación**: Los usuarios pueden deshacer eliminaciones accidentales
2. **Auditoría**: Historial completo de cambios
3. **Reportes**: Análisis de datos históricos
4. **Seguridad**: Menor riesgo de pérdida de datos
5. **Cumplimiento**: Requisitos legales de retención de datos
6. **Filtrado inteligente**: Los filtros por estado funcionan correctamente

## Testing

Para probar que el soft delete funciona correctamente:

```bash
# 1. Iniciar el servidor
python manage.py runserver

# 2. Crear un objeto
curl -X POST http://localhost:8000/api/areas/ -d '{"nombre": "Test Area"}'

# 3. Verificar que aparece en listados normales
curl http://localhost:8000/api/areas/

# 4. Eliminar el objeto (soft delete)
curl -X DELETE http://localhost:8000/api/areas/1/

# 5. Verificar que NO aparece en listados normales
curl http://localhost:8000/api/areas/

# 6. Verificar que SÍ aparece con show_all
curl http://localhost:8000/api/areas/?show_all=true

# 7. Verificar que aparece filtrado como inactivo
curl http://localhost:8000/api/areas/?estado=0

# 8. Verificar que puede filtrar solo activos
curl http://localhost:8000/api/areas/?estado=1
```

## FAQ

### ¿Por qué cuando filtro por "Inactivo" ahora SÍ aparecen los objetos?

**Respuesta**: Hemos mejorado la lógica de filtrado. Ahora cuando especificas explícitamente un filtro por estado (`?estado=0` o `?estado=1`), el sistema **no aplica** el filtro automático por defecto. Esto permite:

- **Sin filtro**: Solo activos (comportamiento por defecto)
- **Filtro explícito**: Solo el estado que especifiques
- **show_all**: Todos los objetos

### ¿Cómo sé si un objeto fue eliminado lógicamente?

**Respuesta**: Todos los objetos eliminados lógicamente tienen `estado='0'`. Puedes verlos usando:

- `?estado=0` para ver solo eliminados
- `?show_all=true` para ver todos (activos + eliminados)
