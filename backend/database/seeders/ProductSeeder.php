<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        Product::updateOrCreate(
            ['sku' => 'WAGI-KMAX-MARKER-001'],
            [
                'name' => 'K-Max White Board Markers',
                'slug' => 'k-max-white-board-markers',
                'barcode' => null,
                'brand' => 'K-Max',
                'category_id' => null,
                'subcategory' => null,
                'description' => 'White board markers for writing on whiteboards.',
                'specifications' => null,
                'price' => 100,
                'discount_price' => null,
                'stock_qty' => 50,
                'availability' => 'in_stock',
                'rating' => 0,
            ]
        );

        Product::updateOrCreate(
            ['sku' => 'NOTEBOOK-001'],
            [
                'name' => 'Note books',
                'slug' => 'note-books',
                'barcode' => null,
                'brand' => null,
                'category_id' => null,
                'subcategory' => null,
                'description' => 'New ones 2027 model',
                'specifications' => null,
                'price' => 300,
                'discount_price' => null,
                'stock_qty' => 40,
                'availability' => 'in_stock',
                'rating' => 0,
            ]
        );
    }
}