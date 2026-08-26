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
use App\Services\InventoryService;

class CheckoutController extends Controller
{
    public function checkout(Request $request)
    {
        $v = Validator::make($request->all(), [
            'payment_method' => 'required|string|in:mpesa,cod',
            'delivery_fee' => 'sometimes|numeric|min:0',
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
                'errors' => $v->errors()
            ], 422);
        }

        $user = $request->user();

        $cart = Cart::where('user_id', $user->id)->first();

        if (!$cart || empty($cart->items)) {
            return response()->json([
                'message' => 'Cart is empty'
            ], 400);
        }

        /*
        |--------------------------------------------------------------------------
        | Calculate subtotal from current product prices
        |--------------------------------------------------------------------------
        */

        $subtotal = 0;

        foreach ($cart->items as $it) {
            $product = Product::find($it['product_id']);

            if (!$product) {
                return response()->json([
                    'message' => 'One of the products in your cart is no longer available.'
                ], 400);
            }

            $quantity = (int) $it['quantity'];

            if ($quantity < 1) {
                return response()->json([
                    'message' => 'Invalid product quantity.'
                ], 400);
            }

            $subtotal += (float) $product->price * $quantity;
        }

        /*
        |--------------------------------------------------------------------------
        | Delivery fee
        |--------------------------------------------------------------------------
        */

        $deliveryFee = (float) $request->input('delivery_fee', 0);

        /*
        |--------------------------------------------------------------------------
        | Tax
        |--------------------------------------------------------------------------
        */

        $tax = (float) $request->input('tax', 0);

        /*
        |--------------------------------------------------------------------------
        | Coupon / discount
        |--------------------------------------------------------------------------
        */

        $discount = 0;
        $coupon = null;

        if ($request->filled('coupon_code')) {
            $couponCode = strtoupper(trim($request->input('coupon_code')));

            $coupon = Coupon::where('code', $couponCode)
                ->where(function ($query) {
                    $query->whereNull('expires_at')
                        ->orWhere('expires_at', '>=', now());
                })
                ->first();

            if (!$coupon) {
                return response()->json([
                    'message' => 'Coupon not found or no longer active.'
                ], 422);
            }

            if ($coupon->type === 'percentage') {
                $discount = round(
                    ($subtotal * (float) $coupon->value) / 100
                );
            } else {
                $discount = (float) $coupon->value;
            }

            // Never allow the discount to exceed the subtotal.
            $discount = min($discount, $subtotal);
        }

        /*
        |--------------------------------------------------------------------------
        | Calculate final total
        |--------------------------------------------------------------------------
        */

        $total = max(
            0,
            $subtotal - $discount + $deliveryFee + $tax
        );

        $orderNumber = 'WAGI-' . strtoupper(Str::random(8));

        $order = null;

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

            foreach ($cart->items as $it) {
                $product = Product::findOrFail($it['product_id']);

                $qty = (int) $it['quantity'];

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'sku' => $product->sku,
                    'quantity' => $qty,
                    'unit_price' => $product->price,
                    'total_price' => $product->price * $qty,
                ]);

                /*
                |--------------------------------------------------------------------------
                | Reserve stock for COD
                |--------------------------------------------------------------------------
                */

                if ($request->payment_method === 'cod') {
                    InventoryService::reduceStock(
                        $product->id,
                        $qty,
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

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to create order',
                'error' => $e->getMessage()
            ], 500);
        }

        /*
        |--------------------------------------------------------------------------
        | M-Pesa
        |--------------------------------------------------------------------------
        |
        | Automatic STK Push is not implemented yet.
        |
        */

        return response()->json([
            'order' => $order,
            'message' => 'Order created'
        ]);
    }

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