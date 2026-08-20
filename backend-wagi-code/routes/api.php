<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\Admin\AdminProductsController;
use App\Http\Controllers\Admin\AdminCategoriesController;
use App\Http\Controllers\Admin\AdminStatsController;
use App\Http\Controllers\Admin\AdminOrderController;
use App\Http\Controllers\Admin\InventoryController;

Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);

/*
|--------------------------------------------------------------------------
| Customer routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    // Cart
    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart', [CartController::class, 'store']);
    Route::delete('/cart/{productId}', [CartController::class, 'remove']);

    // Checkout
    Route::post('/checkout', [CheckoutController::class, 'store']);

});


/*
|--------------------------------------------------------------------------
| Admin routes
|--------------------------------------------------------------------------
*/

Route::prefix('admin')
    ->middleware(['auth:sanctum', 'admin'])
    ->group(function () {

        // Dashboard
        Route::get('/stats', [AdminStatsController::class, 'index']);

        // Products
        Route::get('/products', [AdminProductsController::class, 'index']);
        Route::post('/products', [AdminProductsController::class, 'store']);
        Route::put('/products/{id}', [AdminProductsController::class, 'update']);
        Route::delete('/products/{id}', [AdminProductsController::class, 'destroy']);

        // Product images
        Route::post(
            '/products/{id}/images',
            [ProductController::class, 'uploadImage']
        );

        Route::post(
            '/products/{id}/images/{imageId}/replace',
            [AdminProductsController::class, 'replaceImage']
        );

        Route::delete(
            '/products/{id}/images/{imageId}',
            [AdminProductsController::class, 'deleteImage']
        );

        // Categories
        Route::get('/categories', [AdminCategoriesController::class, 'index']);
        Route::post('/categories', [AdminCategoriesController::class, 'store']);
        Route::put('/categories/{id}', [AdminCategoriesController::class, 'update']);
        Route::delete('/categories/{id}', [AdminCategoriesController::class, 'destroy']);

        // Orders
        Route::get('/orders', [AdminOrderController::class, 'index']);
        Route::get('/orders/{id}', [AdminOrderController::class, 'show']);
        Route::put('/orders/{id}', [AdminOrderController::class, 'update']);

        // Inventory
        Route::post('/inventory/adjust', [InventoryController::class, 'adjust']);
        Route::get('/inventory/low-stock', [InventoryController::class, 'lowStock']);
    });