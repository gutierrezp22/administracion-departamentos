# Gestión de Usuarios

## Descripción

Este módulo permite la gestión completa de usuarios del sistema, incluyendo creación, edición, listado y activación/desactivación de usuarios.

## Funcionalidades

### 1. Lista de Usuarios (`/dashboard/usuarios`)

- **Visualización**: Tabla con información completa de usuarios
- **Filtros**: Por email, nombre, apellido, legajo, documento, rol y estado
- **Acciones**:
  - Editar usuario
  - Activar/Desactivar usuario
  - Exportar a Excel
- **Paginación**: Navegación entre páginas de resultados
- **Estados**: Muestra si el usuario está activo/inactivo y si ha cambiado su contraseña

### 2. Crear Usuario (`/dashboard/usuarios/crear`)

- **Formulario completo** con validaciones:
  - Email (requerido, formato válido)
  - Contraseña (requerida, mínimo 6 caracteres)
  - Confirmación de contraseña
  - Nombre y apellido (requeridos)
  - Legajo y documento (requeridos, numéricos)
  - Rol (requerido, selección de lista)
- **Validaciones en tiempo real**
- **Manejo de errores** específicos del backend

### 3. Editar Usuario (`/dashboard/usuarios/editar/[id]`)

- **Carga automática** de datos del usuario
- **Formulario pre-poblado** con información actual
- **Edición de todos los campos** excepto contraseña
- **Control de estado** (activar/desactivar)
- **Información adicional** del usuario (estado de contraseña, rol actual)

## Estructura de Archivos

```
frontend/src/pages/dashboard/usuarios/
├── index.tsx              # Página principal con enrutamiento
├── list/
│   ├── index.tsx          # Lista de usuarios
│   └── styles.css         # Estilos de la lista
├── create/
│   ├── index.tsx          # Formulario de creación
│   └── styles.css         # Estilos del formulario
└── edit/
    ├── [id].tsx           # Formulario de edición
    └── styles.css         # Estilos del formulario
```

## Integración con Backend

### APIs Utilizadas

- `GET /facet/users/` - Listar usuarios
- `POST /facet/users/` - Crear usuario
- `PUT /facet/users/{id}/` - Actualizar usuario
- `GET /facet/roles/` - Listar roles disponibles

### Modelo de Usuario

```typescript
interface Usuario {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  legajo: number;
  documento: number;
  rol: number;
  rol_detalle: string;
  is_active: boolean;
  date_joined: string;
  last_login: string;
  has_changed_password: boolean;
}
```

## Características Técnicas

### Validaciones

- **Frontend**: Validaciones en tiempo real con feedback visual
- **Backend**: Validaciones de unicidad (email, legajo, documento)
- **Formato**: Validación de email y campos numéricos

### Seguridad

- **Autenticación**: Todas las rutas protegidas con `withAuth`
- **Autorización**: Verificación de permisos en el backend
- **Soft Delete**: Los usuarios se desactivan en lugar de eliminar

### UX/UI

- **Responsive**: Diseño adaptativo para diferentes pantallas
- **Feedback**: Mensajes de éxito/error con SweetAlert2
- **Loading States**: Indicadores de carga durante operaciones
- **Navegación**: Botones de volver y navegación intuitiva

## Uso

### Acceso

1. Ir al menú principal del dashboard
2. Seleccionar "Usuarios" en el sidebar
3. Navegar entre las diferentes opciones

### Crear Usuario

1. Hacer clic en "Agregar Usuario"
2. Completar el formulario con los datos requeridos
3. Seleccionar un rol del sistema
4. Guardar el usuario

### Editar Usuario

1. En la lista, hacer clic en el ícono de editar
2. Modificar los campos necesarios
3. Cambiar el estado activo/inactivo si es necesario
4. Guardar los cambios

### Gestionar Estado

- **Activar**: Hacer clic en el ícono de persona para usuarios inactivos
- **Desactivar**: Hacer clic en el ícono de eliminar para usuarios activos

## Notas Importantes

- Los usuarios inactivos no pueden acceder al sistema
- La contraseña por defecto es el número de documento
- Los usuarios deben cambiar su contraseña en el primer acceso
- El sistema mantiene un historial de cambios de contraseña
- La exportación a Excel incluye todos los usuarios filtrados
