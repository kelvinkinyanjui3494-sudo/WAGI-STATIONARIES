<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\AdminOrderController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\Admin\AdminCategoriesController;
use App\Http\Controllers\Admin\AdminCustomersController;
use App\Http\Controllers\Admin\AdminNotificationsController;
use App\Http\Controllers\Admin\AdminPaymentsController;
use App\Http\Controllers\Admin\AdminProductsController;
use App\Http\Controllers\Admin\AdminReportsController;
use App\Http\Controllers\Admin\AdminStatsController;
use App\Http\Controllers\Admin\InventoryController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Authentication
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Password reset
Route::post('/auth/forgot-password', [PasswordResetController::class, 'sendResetLink']);
Route::post('/auth/reset-password', [PasswordResetController::class, 'reset']);

// Authenticated user routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);
});

// Products
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);

// Cart
Route::get('/cart', [CartController::class, 'index']);
Route::post('/cart', [CartController::class, 'store']);
Route::put('/cart/{id}', [CartController::class, 'update']);
Route::delete('/cart/{id}', [CartController::class, 'destroy']);

// Checkout
Route::post('/checkout', [CheckoutController::class, 'store']);

// Orders
Route::get('/orders', [AdminOrderController::class, 'index']);
Route::get('/orders/{id}', [AdminOrderController::class, 'show']);

/*
|--------------------------------------------------------------------------
| Admin Routes
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

    Route::post(
        '/products/{id}/images/{imageId}/replace',
        [AdminProductsController::class, 'replaceImage']
    );

    Route::delete(
        '/products/{id}/images/{imageId}',
        [AdminProductsController::class, 'deleteImage']
    );

    Route::post(
        '/products/{id}/images',
        [ProductController::class, 'uploadImage']
    );

    // Categories
    Route::get('/categories', [AdminCategoriesController::class, 'index']);
    Route::post('/categories', [AdminCategoriesController::class, 'store']);
    Route::put('/categories/{id}', [AdminCategoriesController::class, 'update']);
    Route::delete('/categories/{id}', [AdminCategoriesController::class, 'destroy']);

    // Customers
    Route::get('/customers', [AdminCustomersController::class, 'index']);
    Route::get('/customers/{id}', [AdminCustomersController::class, 'show']);

    // Payments
    Route::get('/payments', [AdminPaymentsController::class, 'index']);
    Route::get('/payments/{id}', [AdminPaymentsController::class, 'show']);

    // Notifications
    Route::get('/notifications', [AdminNotificationsController::class, 'index']);
    Route::post('/notifications', [AdminNotificationsController::class, 'store']);

    // Reports
    Route::get('/reports', [AdminReportsController::class, 'index']);

    // Inventory
    Route::get('/inventory', [InventoryController::class, 'index']);
    Route::post('/inventory', [InventoryController::class, 'store']);
});