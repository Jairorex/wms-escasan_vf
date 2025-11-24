# Imagen base de PHP 8.2 con extensiones necesarias
FROM php:8.2-cli

# Instalar extensiones requeridas por Laravel y SQL Server
RUN apt-get update && apt-get install -y \
    git unzip libzip-dev gnupg curl libssl-dev unixodbc-dev \
    && docker-php-ext-install zip pdo \
    && pecl install pdo_sqlsrv sqlsrv \
    && docker-php-ext-enable pdo_sqlsrv sqlsrv

# Instalar Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copiar archivos del proyecto
WORKDIR /var/www/html
COPY . .

# Instalar dependencias de Laravel
RUN composer install --no-dev --optimize-autoloader

# Generar clave de app si no existe
RUN php artisan key:generate --force

# Puerto que Railway usará
EXPOSE 8080

# Comando de inicio
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8080"]
