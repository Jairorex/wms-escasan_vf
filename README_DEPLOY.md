# 📦 WMS ESCASAN - Guía de Despliegue

## 🎯 Resumen Rápido

Tu sistema WMS tiene 3 componentes principales:

1. **Backend (Laravel)** - API REST
2. **Frontend Web (React + Vite)** - Interfaz web
3. **App Móvil (Expo)** - Aplicación móvil

## 🚀 Opciones de Despliegue Recomendadas

### Para Empezar Rápido (Recomendado)

| Componente | Servicio | Costo | Tiempo |
|------------|----------|-------|--------|
| Backend | Railway | $5/mes | 5 min |
| Frontend | Vercel | Gratis | 3 min |
| App Móvil | EAS Build | Gratis | 10 min |

**Total: ~$5/mes**

### Para Producción Escalable

| Componente | Servicio | Costo | Tiempo |
|------------|----------|-------|--------|
| Backend | DigitalOcean App Platform | $5/mes | 10 min |
| Frontend | Cloudflare Pages | Gratis | 3 min |
| App Móvil | EAS Build | Gratis | 10 min |

## 📚 Documentación Detallada

- **[QUICK_START_DEPLOY.md](./QUICK_START_DEPLOY.md)** - Guía paso a paso rápida
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Guía completa con todas las opciones

## 🔗 Enlaces Útiles

- **Railway:** https://railway.app
- **Vercel:** https://vercel.com
- **EAS:** https://expo.dev
- **DigitalOcean:** https://digitalocean.com

## ⚙️ Configuración Necesaria

### Variables de Entorno Backend
```
APP_ENV=production
APP_DEBUG=false
APP_KEY=(generar con: php artisan key:generate)
DB_CONNECTION=pgsql
DB_HOST=...
DB_DATABASE=...
DB_USERNAME=...
DB_PASSWORD=...
```

### Variables de Entorno Frontend
```
VITE_API_BASE_URL=https://tu-backend-url.com/api
```

### Variables de Entorno App Móvil
```
EXPO_PUBLIC_API_URL=https://tu-backend-url.com/api
```

## 📝 Próximos Pasos

1. Lee `QUICK_START_DEPLOY.md` para desplegar rápidamente
2. Sigue los pasos para cada componente
3. Configura las URLs entre componentes
4. Prueba todo en producción

¡Éxito con tu despliegue! 🎉

