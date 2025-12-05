# Imagen base
FROM php:8.2-cli

# Instalar extensiones necesarias
RUN apt-get update && apt-get install -y \
    git unzip libzip-dev gnupg curl libssl-dev unixodbc-dev \
    && docker-php-ext-install zip pdo \
    && pecl install pdo_sqlsrv sqlsrv \
    && docker-php-ext-enable pdo_sqlsrv sqlsrv \
    && rm -rf /var/lib/apt/lists/*

# Copiar Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Establecer carpeta de trabajo
WORKDIR /var/www/html

# Copiar archivos del proyecto (Railway ya está en el directorio correcto)
COPY . .

# Instalar dependencias de Laravel
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Crear directorios necesarios y establecer permisos
RUN mkdir -p storage/framework/{sessions,views,cache} storage/logs bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Copiar y hacer ejecutable el script de inicio (después de COPY . .)
RUN cp start.sh /usr/local/bin/start.sh && chmod +x /usr/local/bin/start.sh

# Exponer puerto (Railway usa $PORT dinámicamente)
EXPOSE 8080

# Comando de inicio usando el script mejorado
CMD ["/usr/local/bin/start.sh"]
