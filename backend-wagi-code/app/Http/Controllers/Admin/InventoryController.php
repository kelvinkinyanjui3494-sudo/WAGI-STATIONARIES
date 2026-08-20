<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Services\InventoryService;
use App\Models\Product;

class InventoryController extends Controller
{
    public function adjust(Request $request)
    {
        $v = Validator::make($request->all(), [
            'product_id' => 'required|integer|exists:products,id',
            'change' => 'required|integer',
            'reason' => 'sometimes|string',
        ]);
        if ($v->fails()) return response()->json(['errors'=>$v->errors()],422);

        $productId = $request->product_id;
        $change = (int)$request->change;
        $reason = $request->reason ?? 'manual_adjustment';

        try {
            if ($change < 0) {
                InventoryService::reduceStock($productId, abs($change), $reason);
            } else {
                InventoryService::increaseStock($productId, $change, $reason);
            }
        } catch (\Exception $e) {
            return response()->json(['message' => 'Inventory adjustment failed', 'error' => $e->getMessage()], 500);
        }

        $product = Product::findOrFail($productId);
        return response()->json(['product' => $product]);
    }

    public function lowStock(Request $request)
    {
        $threshold = (int)$request->query('threshold', 5);
        $products = Product::where('stock_qty', '<=', $threshold)->get();
        return response()->json($products);
    }
}
