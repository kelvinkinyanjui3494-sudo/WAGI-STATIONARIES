-- SQL schema for wagi_store (MySQL 8+)
-- Use this SQL to create the initial database schema or translate to Laravel migrations.

CREATE DATABASE IF NOT EXISTS `wagi_store` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `wagi_store`;

-- Users (customers and admins)
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL UNIQUE,
  `email_verified_at` datetime DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `alt_phone` varchar(50) DEFAULT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'customer',
  `profile_picture` varchar(1024) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- Categories
CREATE TABLE `categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL UNIQUE,
  `parent_id` bigint unsigned DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Products
CREATE TABLE `products` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `sku` varchar(100) NOT NULL UNIQUE,
  `barcode` varchar(100) DEFAULT NULL,
  `brand` varchar(255) DEFAULT NULL,
  `category_id` bigint unsigned DEFAULT NULL,
  `subcategory` varchar(255) DEFAULT NULL,
  `description` text,
  `specifications` text,
  `price` decimal(12,2) DEFAULT 0.00,
  `discount_price` decimal(12,2) DEFAULT NULL,
  `stock_qty` int DEFAULT 0,
  `availability` enum('in_stock','out_of_stock','preorder') DEFAULT 'in_stock',
  `rating` decimal(3,2) DEFAULT 0.00,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Product images
CREATE TABLE `product_images` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `path` varchar(1024) NOT NULL,
  `url` varchar(1024) NOT NULL,
  `is_primary` tinyint(1) DEFAULT 0,
  `alt` varchar(255) DEFAULT NULL,
  `meta` json DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Inventory history
CREATE TABLE `inventory` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `change` int NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Orders
CREATE TABLE `orders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_number` varchar(100) NOT NULL UNIQUE,
  `user_id` bigint unsigned NOT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `payment_status` varchar(50) DEFAULT 'unpaid',
  `payment_method` varchar(50) DEFAULT NULL,
  `subtotal` decimal(12,2) DEFAULT 0.00,
  `delivery_fee` decimal(12,2) DEFAULT 0.00,
  `tax` decimal(12,2) DEFAULT 0.00,
  `discount` decimal(12,2) DEFAULT 0.00,
  `total` decimal(12,2) DEFAULT 0.00,
  `delivery_address` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Order items
CREATE TABLE `order_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `product_id` bigint unsigned DEFAULT NULL,
  `product_name` varchar(255) NOT NULL,
  `sku` varchar(100) DEFAULT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(12,2) NOT NULL,
  `total_price` decimal(12,2) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Payments
CREATE TABLE `payments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `amount` decimal(12,2) DEFAULT 0.00,
  `method` varchar(50) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `meta` json DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Additional tables (wishlist, carts, addresses, reviews, notifications, coupons, activity_logs)
CREATE TABLE `carts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `items` json NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `wishlist` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `product_id` bigint unsigned NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `addresses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `county` varchar(255) DEFAULT NULL,
  `town` varchar(255) DEFAULT NULL,
  `estate` varchar(255) DEFAULT NULL,
  `street` varchar(255) DEFAULT NULL,
  `building` varchar(255) DEFAULT NULL,
  `house_number` varchar(100) DEFAULT NULL,
  `nearest_landmark` varchar(255) DEFAULT NULL,
  `instructions` text DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `reviews` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `rating` tinyint unsigned NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `body` text DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `notifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  `data` json DEFAULT NULL,
  `read_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `coupons` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(100) NOT NULL UNIQUE,
  `type` varchar(50) DEFAULT 'percentage',
  `value` decimal(12,2) DEFAULT 0.00,
  `expires_at` datetime DEFAULT NULL,
  `usage_limit` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE `activity_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `meta` json DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;
