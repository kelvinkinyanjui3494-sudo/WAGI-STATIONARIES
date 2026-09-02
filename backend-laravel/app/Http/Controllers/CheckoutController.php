<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Cart;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use App\Services\InventoryService;

class CheckoutController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Checkout
    |--------------------------------------------------------------------------
    |
    | Delivery rules:
    |
    |   Subtotal < KES 5,000  = KES 300 delivery
    |   Subtotal >= KES 5,000 = FREE delivery
    |
    | The delivery fee is calculated by the backend and is never trusted
    | from the customer's request.
    |
    */

    public function checkout(Request $request)
    {
        $v = Validator::make($request->all(), [
            'payment_method' => 'required|string|in:mpesa,cod',

            'tax' => 'sometimes|numeric|min:0',

            'coupon_code' => 'sometimes|string|nullable',

            'address' => 'required|array',
            'address.county' => 'required|string',
            'address.town' => 'required|string',
            'address.estate' => 'nullable|string',
            'address.street' => 'nullable|string',
            'address.house_number' => 'nullable|string',
            'address.nearest_landmark' => 'nullable|string',
            'address.instructions' => 'nullable|string',
        ]);

        if ($v->fails()) {
            return response()->json([
                'message' => 'Please check the checkout information.',
                'errors' => $v->errors(),
            ], 422);
        }

        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'You must be logged in to place an order.',
            ], 401);
        }

        $cart = Cart::where('user_id', $user->id)->first();

        if (!$cart || empty($cart->items)) {
            return response()->json([
                'message' => 'Your cart is empty.',
            ], 400);
        }

        /*
        |--------------------------------------------------------------------------
        | Calculate subtotal from current product prices
        |--------------------------------------------------------------------------
        */

        $subtotal = 0;

        foreach ($cart->items as $item) {
            $product = Product::find($item['product_id']);

            if (!$product) {
                return response()->json([
                    'message' => 'One of the products in your cart is no longer available.',
                ], 400);
            }

            $quantity = (int) ($item['quantity'] ?? 0);

            if ($quantity < 1) {
                return response()->json([
                    'message' => 'Invalid product quantity.',
                ], 400);
            }

            /*
            |--------------------------------------------------------------------------
            | Check stock before creating the order
            |--------------------------------------------------------------------------
            */

            $stockQty = (int) ($product->stock_qty ?? 0);

            if ($stockQty < $quantity) {
                return response()->json([
                    'message' => "Not enough stock available for {$product->name}.",
                ], 400);
            }

            /*
            |--------------------------------------------------------------------------
            | Determine current effective price
            |--------------------------------------------------------------------------
            */

            $price = (float) $product->price;

            $discountPrice = $product->discount_price !== null
                ? (float) $product->discount_price
                : null;

            $effectivePrice = (
                $discountPrice !== null &&
                $discountPrice > 0 &&
                $discountPrice < $price
            )
                ? $discountPrice
                : $price;

            $subtotal += $effectivePrice * $quantity;
        }

        $subtotal = round($subtotal, 2);

        /*
        |--------------------------------------------------------------------------
        | Delivery fee
        |--------------------------------------------------------------------------
        |
        | IMPORTANT:
        | We deliberately do NOT read delivery_fee from the customer's
        | request.
        |
        | This prevents someone from changing the delivery fee to 0
        | through the browser.
        |
        */

        $freeDeliveryThreshold = 5000;
        $standardDeliveryFee = 300;

        $deliveryFee = $subtotal >= $freeDeliveryThreshold
            ? 0
            : $standardDeliveryFee;

        /*
        |--------------------------------------------------------------------------
        | Tax
        |--------------------------------------------------------------------------
        |
        | Tax is currently accepted from the frontend because your current
        | store settings use a zero tax rate.
        |
        */

        $tax = (float) $request->input('tax', 0);

        /*
        |--------------------------------------------------------------------------
        | Coupon discount
        |--------------------------------------------------------------------------
        */

        $discount = 0;
        $coupon = null;

        if ($request->filled('coupon_code')) {
            $couponCode = strtoupper(
                trim($request->input('coupon_code'))
            );

            $coupon = Coupon::where('code', $couponCode)
                ->where(function ($query) {
                    $query
                        ->whereNull('expires_at')
                        ->orWhere('expires_at', '>=', now());
                })
                ->first();

            if (!$coupon) {
                return response()->json([
                    'message' => 'Coupon not found or no longer active.',
                ], 422);
            }

            if ($coupon->type === 'percentage') {
                $discount = round(
                    ($subtotal * (float) $coupon->value) / 100,
                    2
                );
            } else {
                $discount = (float) $coupon->value;
            }

            /*
            |--------------------------------------------------------------------------
            | Never allow coupon to reduce subtotal below zero
            |--------------------------------------------------------------------------
            */

            $discount = min($discount, $subtotal);
        }

        /*
        |--------------------------------------------------------------------------
        | Calculate final total
        |--------------------------------------------------------------------------
        */

        $total = max(
            0,
            round(
                $subtotal - $discount + $deliveryFee + $tax,
                2
            )
        );

        $orderNumber = 'WAGI-' . strtoupper(Str::random(8));

        DB::beginTransaction();

        try {
            /*
            |--------------------------------------------------------------------------
            | Create order
            |--------------------------------------------------------------------------
            */

            $order = Order::create([
                'order_number' => $orderNumber,
                'user_id' => $user->id,
                'status' => 'pending',

                'payment_status' => (
                    $request->payment_method === 'cod'
                        ? 'unpaid'
                        : 'pending'
                ),

                'payment_method' => $request->payment_method,

                'subtotal' => $subtotal,
                'delivery_fee' => $deliveryFee,
                'tax' => $tax,
                'discount' => $discount,
                'total' => $total,

                'delivery_address' => $request->address,
            ]);

            /*
            |--------------------------------------------------------------------------
            | Create order items
            |--------------------------------------------------------------------------
            */

            foreach ($cart->items as $item) {
                $product = Product::find($item['product_id']);

                if (!$product) {
                    throw new \Exception(
                        'A product in the cart is no longer available.'
                    );
                }

                $quantity = (int) ($item['quantity'] ?? 0);

                if ($quantity < 1) {
                    throw new \Exception(
                        'Invalid product quantity.'
                    );
                }

                /*
                |--------------------------------------------------------------------------
                | Re-check stock inside transaction
                |--------------------------------------------------------------------------
                */

                $stockQty = (int) ($product->stock_qty ?? 0);

                if ($stockQty < $quantity) {
                    throw new \Exception(
                        "Not enough stock available for {$product->name}."
                    );
                }

                /*
                |--------------------------------------------------------------------------
                | Current product price
                |--------------------------------------------------------------------------
                */

                $price = (float) $product->price;

                $discountPrice = $product->discount_price !== null
                    ? (float) $product->discount_price
                    : null;

                $effectivePrice = (
                    $discountPrice !== null &&
                    $discountPrice > 0 &&
                    $discountPrice < $price
                )
                    ? $discountPrice
                    : $price;

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'sku' => $product->sku,
                    'quantity' => $quantity,
                    'unit_price' => $effectivePrice,
                    'total_price' => round(
                        $effectivePrice * $quantity,
                        2
                    ),
                ]);

                /*
                |--------------------------------------------------------------------------
                | Reserve stock for Cash on Delivery
                |--------------------------------------------------------------------------
                */

                if ($request->payment_method === 'cod') {
                    InventoryService::reduceStock(
                        $product->id,
                        $quantity,
                        'order_reserve'
                    );
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Create payment record
            |--------------------------------------------------------------------------
            */

            Payment::create([
                'order_id' => $order->id,
                'transaction_id' => null,
                'amount' => $total,
                'method' => $request->payment_method,

                'status' => (
                    $request->payment_method === 'cod'
                        ? 'pending'
                        : 'initiated'
                ),

                'meta' => null,
            ]);

            /*
            |--------------------------------------------------------------------------
            | Clear cart only after successful order creation
            |--------------------------------------------------------------------------
            */

            $cart->items = [];
            $cart->save();

            DB::commit();

/*
|--------------------------------------------------------------------------
| Notify administrators about the new order
|--------------------------------------------------------------------------
*/

User::where('role', 'admin')
    ->get()
    ->each(function ($admin) use ($order) {
        $admin->notify(
            new \App\Notifications\NewOrderNotification($order)
        );
    });

} catch (\Throwable $e) {

            DB::rollBack();

            \Log::error('Checkout failed', [
                'user_id' => $user->id,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'message' => 'Failed to create order.',
                'error' => $e->getMessage(),
            ], 500);
        }

        /*
        |--------------------------------------------------------------------------
        | Successful checkout response
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'order' => $order,
            'message' => 'Order created successfully.',
            'subtotal' => $subtotal,
            'discount' => $discount,
            'delivery_fee' => $deliveryFee,
            'tax' => $tax,
            'total' => $total,
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | Customer orders
    |--------------------------------------------------------------------------
    */

    public function orders(Request $request)
    {
        $orders = Order::where(
            'user_id',
            $request->user()->id
        )
            ->with('items')
            ->paginate(20);

        return response()->json($orders);
    }

    /*
    |--------------------------------------------------------------------------
    | Show one customer order
    |--------------------------------------------------------------------------
    */

    public function show(Request $request, $id)
    {
        $order = Order::where(
            'user_id',
            $request->user()->id
        )
            ->with('items')
            ->findOrFail($id);

        return response()->json($order);
    }
}
