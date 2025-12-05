# Imagen base
FROM php:8.2-cli

# Instalar extensiones necesarias y Microsoft ODBC Driver para SQL Server
RUN apt-get update && apt-get install -y \
    git unzip libzip-dev gnupg curl libssl-dev unixodbc-dev \
    && curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - \
    && curl https://packages.microsoft.com/config/debian/11/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y msodbcsql18 unixodbc-dev \
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

# Copiar y hacer ejecutable el script de entrada (verificar que existe)
RUN if [ -f entrypoint.sh ]; then \
        cp entrypoint.sh /usr/local/bin/entrypoint.sh && \
        chmod +x /usr/local/bin/entrypoint.sh; \
    else \
        echo "⚠️  entrypoint.sh no encontrado, creando uno básico..."; \
        echo '#!/bin/sh' > /usr/local/bin/entrypoint.sh && \
        echo 'php artisan config:clear || true' >> /usr/local/bin/entrypoint.sh && \
        echo 'php artisan cache:clear || true' >> /usr/local/bin/entrypoint.sh && \
        echo 'exec php artisan serve --host=0.0.0.0 --port=${PORT:-8080}' >> /usr/local/bin/entrypoint.sh && \
        chmod +x /usr/local/bin/entrypoint.sh; \
    fi

# Exponer puerto (Railway usa $PORT dinámicamente)
EXPOSE 8080

# Comando de inicio usando el script de entrada
CMD ["/usr/local/bin/entrypoint.sh"]
