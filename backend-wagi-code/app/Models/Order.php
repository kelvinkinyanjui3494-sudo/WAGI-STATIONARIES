<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number', 'user_id', 'status', 'payment_status', 'payment_method', 'subtotal', 'delivery_fee', 'tax', 'discount', 'total', 'delivery_address'
    ];

    protected $casts = [
        'delivery_address' => 'array',
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}
