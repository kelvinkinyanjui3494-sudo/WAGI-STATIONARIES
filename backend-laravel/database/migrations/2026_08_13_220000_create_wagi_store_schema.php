<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Categories
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->foreignId('parent_id')
                ->nullable()
                ->constrained('categories')
                ->nullOnDelete();
            $table->timestamps();
        });

        // Products
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug');
            $table->string('sku')->unique();
            $table->string('barcode')->nullable();
            $table->string('brand')->nullable();
            $table->foreignId('category_id')
                ->nullable()
                ->constrained('categories')
                ->nullOnDelete();
            $table->string('subcategory')->nullable();
            $table->text('description')->nullable();
            $table->text('specifications')->nullable();
            $table->decimal('price', 12, 2)->default(0);
            $table->decimal('discount_price', 12, 2)->nullable();
            $table->integer('stock_qty')->default(0);
            $table->enum('availability', [
                'in_stock',
                'out_of_stock',
                'preorder'
            ])->default('in_stock');
            $table->decimal('rating', 3, 2)->default(0);
            $table->timestamps();
        });

        // Product images
        Schema::create('product_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')
                ->constrained('products')
                ->cascadeOnDelete();
            $table->string('path', 1024);
            $table->string('url', 1024);
            $table->boolean('is_primary')->default(false);
            $table->string('alt')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();
        });

        // Inventory history
        Schema::create('inventory', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')
                ->constrained('products')
                ->cascadeOnDelete();
            $table->integer('change');
            $table->string('reason')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        // Orders
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->string('status')->default('pending');
            $table->string('payment_status')->default('unpaid');
            $table->string('payment_method')->nullable();
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('delivery_fee', 12, 2)->default(0);
            $table->decimal('tax', 12, 2)->default(0);
            $table->decimal('discount', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->text('delivery_address')->nullable();
            $table->timestamps();
        });

        // Order items
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')
                ->constrained('orders')
                ->cascadeOnDelete();
            $table->foreignId('product_id')
                ->nullable()
                ->constrained('products')
                ->nullOnDelete();
            $table->string('product_name');
            $table->string('sku')->nullable();
            $table->integer('quantity');
            $table->decimal('unit_price', 12, 2);
            $table->decimal('total_price', 12, 2);
            $table->timestamp('created_at')->useCurrent();
        });

        // Payments
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')
                ->constrained('orders')
                ->cascadeOnDelete();
            $table->string('transaction_id')->nullable();
            $table->decimal('amount', 12, 2)->default(0);
            $table->string('method')->nullable();
            $table->string('status')->default('pending');
            $table->json('meta')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        // Carts
        Schema::create('carts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->json('items');
            $table->timestamps();
        });

        // Wishlist
        Schema::create('wishlist', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->foreignId('product_id')
                ->constrained('products')
                ->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();
        });

        // Addresses
        Schema::create('addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->string('county')->nullable();
            $table->string('town')->nullable();
            $table->string('estate')->nullable();
            $table->string('street')->nullable();
            $table->string('building')->nullable();
            $table->string('house_number')->nullable();
            $table->string('nearest_landmark')->nullable();
            $table->text('instructions')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        // Reviews
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')
                ->constrained('products')
                ->cascadeOnDelete();
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->string('title')->nullable();
            $table->text('body')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        // Notifications
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->cascadeOnDelete();
            $table->string('type')->nullable();
            $table->json('data')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        // Coupons
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('type')->default('percentage');
            $table->decimal('value', 12, 2)->default(0);
            $table->timestamp('expires_at')->nullable();
            $table->integer('usage_limit')->nullable();
            $table->timestamps();
        });

        // Activity logs
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->string('action');
            $table->json('meta')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('coupons');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('addresses');
        Schema::dropIfExists('wishlist');
        Schema::dropIfExists('carts');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('inventory');
        Schema::dropIfExists('product_images');
        Schema::dropIfExists('products');
        Schema::dropIfExists('categories');
    }
};