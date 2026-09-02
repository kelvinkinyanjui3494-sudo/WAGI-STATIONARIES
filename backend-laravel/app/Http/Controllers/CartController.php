<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Cart;
use App\Models\Product;

class CartController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $cart = Cart::firstOrCreate(
            ['user_id' => $user->id],
            ['items' => []]
        );

        return response()->json($cart);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|integer|exists:products,id',
            'quantity' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        $cart = Cart::firstOrCreate(
            ['user_id' => $user->id],
            ['items' => []]
        );

        $product = Product::findOrFail($request->product_id);

        $items = $cart->items ?? [];
        $found = false;

        foreach ($items as &$item) {
            if ((int) $item['product_id'] === (int) $product->id) {
                $item['quantity'] += (int) $request->quantity;
                $found = true;
                break;
            }
        }

        unset($item);

        if (!$found) {
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

    $items[] = [
        'product_id' => $product->id,
        'sku' => $product->sku,
        'name' => $product->name,
        'unit_price' => $effectivePrice,
        'quantity' => (int) $request->quantity,
    ];
}

        $cart->items = $items;
        $cart->save();

        return response()->json($cart);
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'quantity' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        $cart = Cart::firstOrCreate(
            ['user_id' => $user->id],
            ['items' => []]
        );

        $items = $cart->items ?? [];
        $updatedItems = [];

        foreach ($items as $item) {
            if ((string) $item['product_id'] === (string) $id) {
                if ((int) $request->quantity > 0) {
                    $item['quantity'] = (int) $request->quantity;
                    $updatedItems[] = $item;
                }

                continue;
            }

            $updatedItems[] = $item;
        }

        $cart->items = $updatedItems;
        $cart->save();

        return response()->json($cart);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        $cart = Cart::firstOrCreate(
            ['user_id' => $user->id],
            ['items' => []]
        );

        $items = $cart->items ?? [];

        $items = array_values(array_filter(
            $items,
            function ($item) use ($id) {
                return (string) $item['product_id'] !== (string) $id;
            }
        ));

        $cart->items = $items;
        $cart->save();

        return response()->json($cart);
    }
}