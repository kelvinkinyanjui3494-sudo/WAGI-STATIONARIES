<?php

use Illuminate\Support\Facades\Route;
use App\Models\Coupon;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\AdminOrderController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\AdminCategoriesController;
use App\Http\Controllers\Admin\AdminCustomersController;
use App\Http\Controllers\Admin\AdminNotificationsController;
use App\Http\Controllers\Admin\AdminPaymentsController;
use App\Http\Controllers\Admin\AdminProductsController;
use App\Http\Controllers\Admin\AdminReportsController;
use App\Http\Controllers\Admin\AdminStatsController;
use App\Http\Controllers\Admin\InventoryController;
use App\Http\Controllers\WishlistController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Authentication
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Password reset
Route::post('/auth/forgot-password', [PasswordResetController::class, 'forgot']);
Route::post('/auth/verify-reset-code', [PasswordResetController::class, 'verifyCode']);
Route::post('/auth/reset-password', [PasswordResetController::class, 'reset']);

// Authenticated user routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    // Customer profile
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);

    // Customer notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead']);
});

// Wishlist
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/wishlist', [WishlistController::class, 'index']);
    Route::post('/wishlist', [WishlistController::class, 'store']);
    Route::delete('/wishlist/{productId}', [WishlistController::class, 'destroy']);
});

// Public Categories
Route::get('/categories', [AdminCategoriesController::class, 'index']);

// Products
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);

// Store Settings
Route::get('/store-settings', function () {
    return response()->json([
        'delivery_fee' => 300,
        'free_delivery_threshold' => 5000,
        'tax_rate' => 0,
        'mpesa_phone' => null,
    ]);
});

// Coupons
Route::get('/coupons/{code}', function ($code) {
    $coupon = Coupon::where('code', strtoupper($code))
        ->where(function ($query) {
            $query->whereNull('expires_at')
                ->orWhere('expires_at', '>=', now());
        })
        ->first();

    if (!$coupon) {
        return response()->json([
            'message' => 'Coupon not found or no longer active'
        ], 404);
    }

    return response()->json([
        'coupon' => $coupon
    ]);
});

// Cart
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart', [CartController::class, 'store']);
    Route::put('/cart/{id}', [CartController::class, 'update']);
    Route::delete('/cart/{id}', [CartController::class, 'destroy']);
});

// Checkout
Route::middleware('auth:sanctum')->post(
    '/checkout',
    [CheckoutController::class, 'checkout']
);
// Customer Orders
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
});

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
    // Orders
    Route::get('/orders', [AdminOrderController::class, 'index']);
    Route::get('/orders/{id}', [AdminOrderController::class, 'show']);
    Route::post('/orders/{id}/status', [AdminOrderController::class, 'updateStatus']);
    // Payments
    Route::get('/payments', [AdminPaymentsController::class, 'index']);
    Route::get('/payments/{id}', [AdminPaymentsController::class, 'show']);
    // Notifications
   Route::get('/notifications', [AdminNotificationsController::class, 'index']);
   Route::post('/notifications/{id}/read', [AdminNotificationsController::class, 'markRead']);
    // Reports
    Route::get('/reports', [AdminReportsController::class, 'index']);
    // Inventory
    Route::get('/inventory', [InventoryController::class, 'index']);
    Route::post('/inventory', [InventoryController::class, 'store']);
});