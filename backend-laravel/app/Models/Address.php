<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Address extends Model
{
    protected $table = 'addresses';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'county',
        'town',
        'estate',
        'street',
        'building',
        'house_number',
        'nearest_landmark',
        'instructions',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}