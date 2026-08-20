<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->string('slug')->unique();
            $table->string('sku')->unique();
            $table->string('barcode')->nullable();
            $table->string('brand')->nullable();

            $table->foreignId('category_id')
                ->nullable()
                ->constrained('categories')
                ->nullOnDelete();

            $table->string('subcategory')->nullable();

            $table->text('description')->nullable();

            $table->json('specifications')->nullable();

            $table->decimal('price', 10, 2);
            $table->decimal('discount_price', 10, 2)->nullable();

            $table->integer('stock_qty')->default(0);

            $table->string('availability')->default('in_stock');

            $table->decimal('rating', 3, 2)->default(0);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};