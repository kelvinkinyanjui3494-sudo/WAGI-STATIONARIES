FROM php:8.3-apache

# Install system dependencies and PHP extensions
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libicu-dev \
    libcurl4-openssl-dev \
    && docker-php-ext-install \
        pdo_mysql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        intl \
        zip \
    && a2dismod mpm_event mpm_worker 2>/dev/null || true

RUN a2enmod mpm_prefork rewrite headers

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Laravel application directory
WORKDIR /var/www/html

# Copy Laravel application
COPY . .

# Install production PHP dependencies
RUN composer install \
    --no-dev \
    --optimize-autoloader \
    --no-interaction \
    --prefer-dist

# Configure Apache to serve Laravel's public directory
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public

RUN sed -ri \
    -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
    /etc/apache2/sites-available/*.conf \
    /etc/apache2/apache2.conf \
    /etc/apache2/conf-available/*.conf

# Add CORS headers for the deployed frontends
RUN printf '%s\n' \
    'SetEnvIf Origin "^https://(wagi-app|wagi-stationary)\\.netlify\\.app$" CORS_ORIGIN=$0' \
    'Header always set Access-Control-Allow-Origin "%{CORS_ORIGIN}e" env=CORS_ORIGIN' \
    'Header always set Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" env=CORS_ORIGIN' \
    'Header always set Access-Control-Allow-Headers "Accept, Authorization, Content-Type, Origin, X-Requested-With, X-XSRF-TOKEN" env=CORS_ORIGIN' \
    'Header always merge Vary Origin' \
    >> /etc/apache2/apache2.conf

# Laravel storage and cache permissions
RUN mkdir -p \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Configure Apache to listen on Render's port
RUN sed -i 's/^Listen 80$/Listen 10000/' /etc/apache2/ports.conf \
    && sed -i 's/<VirtualHost \*:80>/<VirtualHost *:10000>/' \
        /etc/apache2/sites-available/000-default.conf

EXPOSE 10000

CMD ["sh", "-c", "php artisan migrate --path=database/migrations/2026_10_14_130000_create_email_verification_handoffs_table.php --force && exec apache2-foreground"]
