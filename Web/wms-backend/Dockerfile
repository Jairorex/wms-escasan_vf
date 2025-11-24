# Imagen base
FROM php:8.2-cli

# Instalar extensiones necesarias
RUN apt-get update && apt-get install -y \
    git unzip libzip-dev gnupg curl libssl-dev unixodbc-dev \
    && docker-php-ext-install zip pdo \
    && pecl install pdo_sqlsrv sqlsrv \
    && docker-php-ext-enable pdo_sqlsrv sqlsrv

# Copiar Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Establecer carpeta de trabajo
WORKDIR /var/www/html

# Copiar SOLO el backend Laravel
COPY Web/wms-backend/ ./

# Instalar dependencias de Laravel
RUN composer install --no-dev --optimize-autoloader

# Generar clave de app
RUN php artisan key:generate --force

# Exponer puerto y ejecutar servidor
EXPOSE 8080
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8080"]
