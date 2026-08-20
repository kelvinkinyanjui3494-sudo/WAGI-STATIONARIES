<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductImage extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'path',
        'url',
        'is_primary',
        'alt',
        'meta',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
