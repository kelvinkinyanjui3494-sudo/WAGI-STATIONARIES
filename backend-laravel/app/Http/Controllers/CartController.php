<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Models\Cart;
use App\Models\Product;

class CartController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();
        $cart = Cart::firstOrCreate(['user_id' => $user->id], ['items' => []]);
        return response()->json($cart);
    }

    public function add(Request $request)
    {
        $v = Validator::make($request->all(), [
            'product_id' => 'required|integer|exists:products,id',
            'quantity' => 'required|integer|min:1',
        ]);

        if ($v->fails()) {
            return response()->json(['errors' => $v->errors()], 422);
        }

        $user = $request->user();
        $cart = Cart::firstOrCreate(['user_id' => $user->id], ['items' => []]);

        $product = Product::findOrFail($request->product_id);

        $items = $cart->items ?? [];
        $found = false;
        foreach ($items as &$item) {
            if ($item['product_id'] == $product->id) {
                $item['quantity'] += $request->quantity;
                $found = true;
                break;
            }
        }
        if (!$found) {
            $items[] = [
                'product_id' => $product->id,
                'sku' => $product->sku,
                'name' => $product->name,
                'unit_price' => (float)$product->price,
                'quantity' => $request->quantity,
            ];
        }

        $cart->items = $items;
        $cart->save();

        return response()->json($cart);
    }

    public function update(Request $request)
    {
        $v = Validator::make($request->all(), [
            'items' => 'required|array',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.quantity' => 'required|integer|min:0',
        ]);

        if ($v->fails()) {
            return response()->json(['errors' => $v->errors()], 422);
        }

        $user = $request->user();
        $cart = Cart::firstOrCreate(['user_id' => $user->id], ['items' => []]);

        $items = [];
        foreach ($request->items as $item) {
            if ($item['quantity'] <= 0) continue;
            $product = Product::findOrFail($item['product_id']);
            $items[] = [
                'product_id' => $product->id,
                'sku' => $product->sku,
                'name' => $product->name,
                'unit_price' => (float)$product->price,
                'quantity' => $item['quantity'],
            ];
        }
        $cart->items = $items;
        $cart->save();

        return response()->json($cart);
    }

    public function remove(Request $request, $productId)
    {
        $user = $request->user();
        $cart = Cart::firstOrCreate(['user_id' => $user->id], ['items' => []]);
        $items = $cart->items ?? [];
        $items = array_values(array_filter($items, function($i) use ($productId) {
            return $i['product_id'] != $productId;
        }));

        $cart->items = $items;
        $cart->save();
        return response()->json($cart);
    }
}
