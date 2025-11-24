# Crear Usuarios por Defecto

Este documento explica cómo crear los usuarios administrador y operario por defecto en el sistema WMS.

## 📋 Usuarios que se Crean

1. **Administrador**
   - Usuario: `admin`
   - Contraseña: `admin123`
   - Email: `admin@wms.com`
   - Rol: Administrador

2. **Operario**
   - Usuario: `operario`
   - Contraseña: `operario123`
   - Email: `operario@wms.com`
   - Rol: Operario

## 🚀 Métodos para Crear Usuarios

### Método 1: Usando el Comando Artisan (Recomendado)

```bash
cd web/wms-backend
php artisan wms:create-users
```

**Opciones:**
- `--force`: Forzar recreación aunque los usuarios ya existan

```bash
php artisan wms:create-users --force
```

### Método 2: Usando Seeder

```bash
cd web/wms-backend
php artisan db:seed --class=UsuarioSeeder
```

### Método 3: Usando DatabaseSeeder

```bash
cd web/wms-backend
php artisan db:seed
```

## 📝 Ejemplo de Salida

```
🚀 Creando usuarios por defecto...

✅ Roles verificados/creados
✅ Usuario Administrador creado
✅ Usuario Operario creado

═══════════════════════════════════════════════════
📋 CREDENCIALES DE ACCESO
═══════════════════════════════════════════════════

+---------------+----------+------------+------------------+
| Rol           | Usuario  | Contraseña | Email            |
+---------------+----------+------------+------------------+
| Administrador| admin    | admin123   | admin@wms.com    |
| Operario      | operario | operario123| operario@wms.com |
+---------------+----------+------------+------------------+

⚠️  IMPORTANTE: Cambia estas contraseñas después del primer inicio de sesión
```

## ⚠️ Notas Importantes

1. **Seguridad**: Las contraseñas por defecto son simples. **DEBES cambiarlas** después del primer inicio de sesión.

2. **Roles**: Si los roles "Administrador" y "Operario" no existen, se crearán automáticamente.

3. **Duplicados**: Si los usuarios ya existen, el comando no los recreará a menos que uses `--force`.

4. **Base de Datos**: Asegúrate de que:
   - La conexión a la base de datos esté configurada correctamente
   - Las migraciones estén ejecutadas (`php artisan migrate`)

## 🔐 Cambiar Contraseñas

### Desde el Frontend
1. Inicia sesión con el usuario
2. Ve a tu perfil (si está implementado)
3. Usa la opción "Cambiar Contraseña"

### Desde la API
```bash
curl -X POST http://localhost:8000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -d '{
    "usuario_id": 1,
    "current_password": "admin123",
    "new_password": "nueva_contraseña_segura",
    "new_password_confirmation": "nueva_contraseña_segura"
  }'
```

### Desde el Backend (Tinker)
```bash
php artisan tinker
```

```php
$admin = App\Models\Usuario::where('usuario', 'admin')->first();
$admin->password = Hash::make('nueva_contraseña_segura');
$admin->save();
```

## 🧪 Probar el Login

### Desde el Frontend
1. Ve a `http://localhost:3000/login` (o el puerto de tu frontend)
2. Ingresa las credenciales:
   - Usuario: `admin` o `operario`
   - Contraseña: `admin123` o `operario123`

### Desde la API
```bash
# Login como admin
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"admin","password":"admin123"}'

# Login como operario
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"operario","password":"operario123"}'
```

## 📚 Archivos Relacionados

- `database/seeders/UsuarioSeeder.php` - Seeder para crear usuarios
- `app/Console/Commands/CreateDefaultUsers.php` - Comando artisan
- `app/Models/Usuario.php` - Modelo de usuario
- `app/Models/Rol.php` - Modelo de rol

