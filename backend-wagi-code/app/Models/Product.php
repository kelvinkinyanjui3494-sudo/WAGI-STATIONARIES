<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'sku',
        'barcode',
        'brand',
        'category_id',
        'subcategory',
        'description',
        'specifications',
        'price',
        'discount_price',
        'stock_qty',
        'availability',
        'rating',
    ];

    public function images()
    {
        return $this->hasMany(ProductImage::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}
