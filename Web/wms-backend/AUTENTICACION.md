# Sistema de Autenticación y Gestión de Usuarios

## ✅ Implementación Completa

Se ha implementado un sistema completo de autenticación y gestión de usuarios para el WMS.

## 🔐 Backend - Autenticación

### Controladores

#### AuthController (`app/Http/Controllers/Api/AuthController.php`)
- **POST `/api/auth/login`** - Iniciar sesión
  - Recibe: `usuario` (o email) y `password`
  - Retorna: Token y datos del usuario con su rol

- **POST `/api/auth/logout`** - Cerrar sesión
  - Revoca el token (pendiente implementar con Sanctum)

- **GET `/api/auth/me`** - Obtener usuario autenticado
  - Retorna datos del usuario actual (pendiente implementar verificación de token)

- **POST `/api/auth/change-password`** - Cambiar contraseña
  - Requiere: `current_password`, `new_password`, `new_password_confirmation`, `usuario_id`

#### UsuarioController (`app/Http/Controllers/Api/UsuarioController.php`)
- **GET `/api/usuarios`** - Listar usuarios
  - Parámetros opcionales: `rol_id`, `search`
  - Incluye relación con rol

- **GET `/api/usuarios/{id}`** - Obtener usuario específico

- **POST `/api/usuarios`** - Crear usuario
  - Requiere: `nombre`, `usuario`, `email`, `password`, `rol_id`
  - Valida: usuario y email únicos

- **PUT `/api/usuarios/{id}`** - Actualizar usuario
  - Campos opcionales: `nombre`, `usuario`, `email`, `password`, `rol_id`
  - Si no se envía `password`, no se actualiza

- **DELETE `/api/usuarios/{id}`** - Eliminar usuario
  - Valida que no tenga tareas o movimientos asociados

- **POST `/api/usuarios/{id}/reset-password`** - Resetear contraseña
  - Requiere: `new_password`

### Configuración

#### `config/auth.php`
- Actualizado para usar el modelo `App\Models\Usuario` en lugar de `User`

#### Rutas (`routes/api.php`)
- Rutas de autenticación públicas: `/api/auth/*`
- Rutas de usuarios: `/api/usuarios/*`

## 🎨 Frontend - Autenticación

### Contexto de Autenticación

#### `src/contexts/AuthContext.jsx`
- Proporciona estado global de autenticación
- Funciones: `login()`, `logout()`, `isAuthenticated()`
- Persiste usuario en `localStorage`

### Componentes

#### Login (`src/pages/Login/Login.jsx`)
- Formulario de inicio de sesión
- Validación de credenciales
- Manejo de errores
- Redirección automática si ya está autenticado

#### Layout (`src/components/Layout/Layout.jsx`)
- Muestra información del usuario autenticado
- Botón de cerrar sesión funcional
- Muestra rol del usuario

### Gestión de Usuarios

#### Página de Usuarios (`src/pages/Catalogos/Usuarios.jsx`)
- Lista todos los usuarios con búsqueda
- Filtrado por rol
- Acciones: Crear, Editar, Eliminar

#### Modal de Usuario (`src/components/Modal/UsuarioFormModal.jsx`)
- Formulario para crear/editar usuarios
- Validación de campos
- Selección de rol
- Manejo de contraseña (opcional en edición)

### Servicios API

#### `src/services/api.js`
Métodos agregados:
- `login(credentials)` - Iniciar sesión
- `logout()` - Cerrar sesión
- `getMe()` - Obtener usuario actual
- `changePassword(data)` - Cambiar contraseña
- `getUsuarios(params)` - Listar usuarios
- `getUsuario(id)` - Obtener usuario
- `createUsuario(data)` - Crear usuario
- `updateUsuario(id, data)` - Actualizar usuario
- `deleteUsuario(id)` - Eliminar usuario
- `resetPassword(id, newPassword)` - Resetear contraseña

### Protección de Rutas

#### `src/App.jsx`
- Componente `ProtectedRoute` que verifica autenticación
- Redirige a `/login` si no está autenticado
- Muestra loading mientras verifica autenticación

## 🔑 Sistema de Tokens

### Implementación Actual
- Tokens simples generados con `base64_encode(user_id:timestamp:random)`
- Almacenados en `localStorage` como `auth_token`
- Enviados en header `Authorization: Bearer {token}`

### Mejoras Futuras
- Implementar Laravel Sanctum para tokens más seguros
- Agregar expiración de tokens
- Implementar refresh tokens
- Verificación real de tokens en middleware

## 📝 Uso

### Iniciar Sesión
1. Ir a `/login`
2. Ingresar usuario/email y contraseña
3. Al autenticarse, se guarda token y datos de usuario
4. Redirección automática al dashboard

### Gestionar Usuarios
1. Ir a `/catalogos/usuarios`
2. Crear nuevo usuario: Click en "Nuevo Usuario"
3. Editar usuario: Click en icono de editar
4. Eliminar usuario: Click en icono de eliminar (con confirmación)

### Cerrar Sesión
1. Click en "Cerrar Sesión" en el sidebar
2. Confirmar acción
3. Redirección a `/login`

## 🔒 Seguridad

### Implementado
- Contraseñas hasheadas con `Hash::make()`
- Validación de credenciales
- Tokens en localStorage (temporal)

### Pendiente
- Implementar Sanctum para tokens seguros
- Middleware de autenticación en rutas protegidas
- Verificación de permisos por rol
- Rate limiting en login
- CSRF protection

## 🧪 Pruebas

### Probar Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"admin","password":"password"}'
```

### Probar CRUD de Usuarios
```bash
# Listar
curl http://localhost:8000/api/usuarios

# Crear
curl -X POST http://localhost:8000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test User","usuario":"test","email":"test@test.com","password":"password123","rol_id":1}'

# Actualizar
curl -X PUT http://localhost:8000/api/usuarios/1 \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Updated Name"}'

# Eliminar
curl -X DELETE http://localhost:8000/api/usuarios/1
```

## 📋 Notas

- El sistema actual usa tokens simples. Para producción, implementar Sanctum.
- Las contraseñas se validan con mínimo 6 caracteres.
- Los usuarios no se pueden eliminar si tienen tareas o movimientos asociados.
- El email y usuario deben ser únicos en el sistema.

