<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Cart;
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
            return response()->json(['errors' => $v->errors()], 422);
        }

        $user = $request->user();
        $cart = Cart::where('user_id', $user->id)->first();
        if (!$cart || empty($cart->items)) {
            return response()->json(['message' => 'Cart is empty'], 400);
        }

        // Calculate totals
        $subtotal = 0;
        foreach ($cart->items as $it) {
            $subtotal += $it['unit_price'] * $it['quantity'];
        }
        $deliveryFee = $request->input('delivery_fee', 0);
        $tax = $request->input('tax', 0);
        $discount = 0; // coupon handling omitted for brevity
        $total = $subtotal + $deliveryFee + $tax - $discount;

        $orderNumber = 'WAGI-' . strtoupper(Str::random(8));

        $order = null;

        DB::beginTransaction();
        try {
            $order = Order::create([
                'order_number' => $orderNumber,
                'user_id' => $user->id,
                'status' => 'pending',
                'payment_status' => ($request->payment_method === 'cod') ? 'unpaid' : 'pending',
                'payment_method' => $request->payment_method,
                'subtotal' => $subtotal,
                'delivery_fee' => $deliveryFee,
                'tax' => $tax,
                'discount' => $discount,
                'total' => $total,
                'delivery_address' => $request->address,
            ]);

            foreach ($cart->items as $it) {
                $product = Product::findOrFail($it['product_id']);
                $qty = (int)$it['quantity'];
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'sku' => $product->sku,
                    'quantity' => $qty,
                    'unit_price' => $product->price,
                    'total_price' => $product->price * $qty,
                ]);

                // For COD: reserve stock immediately
                if ($request->payment_method === 'cod') {
                    InventoryService::reduceStock($product->id, $qty, 'order_reserve');
                }
            }

            // create payment record (pending)
            $payment = Payment::create([
                'order_id' => $order->id,
                'transaction_id' => null,
                'amount' => $total,
                'method' => $request->payment_method,
                'status' => ($request->payment_method === 'cod') ? 'pending' : 'initiated',
                'meta' => null,
            ]);

            // Clear user's cart only after order created
            $cart->items = [];
            $cart->save();

            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create order', 'error' => $e->getMessage()], 500);
        }

        // For mpesa, trigger STK Push in a separate service (not implemented here) — payment status will update via callback endpoint

        return response()->json(['order' => $order, 'message' => 'Order created']);
    }

    public function orders(Request $request)
    {
        $orders = Order::where('user_id', $request->user()->id)->with('items')->paginate(20);
        return response()->json($orders);
    }

    public function show(Request $request, $id)
    {
        $order = Order::where('user_id', $request->user()->id)->with('items')->findOrFail($id);
        return response()->json($order);
    }
}
