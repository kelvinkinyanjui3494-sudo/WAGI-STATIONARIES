dockerfile
FROM php:8.3-apache

# Install system dependencies
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
    && a2dismod mpm_event mpm_worker 2>/dev/null || true \
    && a2enmod mpm_prefork rewrite \
    && rm -rf /var/lib/apt/lists/*

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
    --no-interaction

# Configure Apache to serve Laravel's public directory
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public

RUN sed -ri \
    -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
    /etc/apache2/sites-available/*.conf \
    /etc/apache2/apache2.conf \
    /etc/apache2/conf-available/*.conf

# Laravel storage and cache permissions
RUN mkdir -p \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache \
    && chown -R www-data:www-data \
        storage \
        bootstrap/cache \
    && chmod -R 775 \
        storage \
        bootstrap/cache

# Railway supplies PORT at runtime.
# Apache will listen on port 8080 by default.
RUN sed -i 's/^Listen 80$/Listen 8080/' /etc/apache2/ports.conf \
    && sed -i 's/<VirtualHost \*:80>/<VirtualHost *:8080>/' \
        /etc/apache2/sites-available/000-default.conf

EXPOSE 8080

CMD ["apache2-foreground"]

