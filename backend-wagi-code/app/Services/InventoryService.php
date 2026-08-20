<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Inventory as InventoryModel;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    public static function reduceStock(int $productId, int $qty, string $reason = null)
    {
        return DB::transaction(function () use ($productId, $qty, $reason) {
            $product = Product::lockForUpdate()->findOrFail($productId);
            if ($product->stock_qty < $qty) {
                throw new \Exception('Insufficient stock for product ID: ' . $productId);
            }
            $product->stock_qty -= $qty;
            $product->save();

            InventoryModel::create([
                'product_id' => $productId,
                'change' => -$qty,
                'reason' => $reason ?? 'order',
            ]);

            return $product;
        });
    }

    public static function increaseStock(int $productId, int $qty, string $reason = null)
    {
        return DB::transaction(function () use ($productId, $qty, $reason) {
            $product = Product::lockForUpdate()->findOrFail($productId);
            $product->stock_qty += $qty;
            $product->save();

            InventoryModel::create([
                'product_id' => $productId,
                'change' => $qty,
                'reason' => $reason ?? 'restock',
            ]);

            return $product;
        });
    }
}
