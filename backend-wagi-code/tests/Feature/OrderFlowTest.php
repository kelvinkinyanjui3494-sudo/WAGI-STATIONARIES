<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Product;

class OrderFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_cart_checkout_order_flow()
    {
        // Create user and product
        $user = User::factory()->create();
        $product = Product::create([
            'name' => 'Sample Product',
            'slug' => 'sample-product',
            'sku' => 'SAMPLE-001',
            'price' => 100.00,
            'stock_qty' => 10,
        ]);

        // Login and get token
        $response = $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'password']);

        // Laravel default factory sets password as 'password' hashed
        $token = $response->json('token');

        $headers = ['Authorization' => "Bearer {$token}"];

        // Add to cart
        $this->postJson('/api/cart', ['product_id' => $product->id, 'quantity' => 2], $headers)->assertStatus(200);

        // Checkout
        $checkoutPayload = [
            'payment_method' => 'cod',
            'delivery_fee' => 50,
            'tax' => 0,
            'address' => [
                'county' => 'Nairobi',
                'town' => 'Latema',
            ]
        ];

        $this->postJson('/api/checkout', $checkoutPayload, $headers)->assertStatus(200)->assertJsonStructure(['order']);

        // Verify stock decreased
        $this->assertDatabaseHas('products', ['id' => $product->id, 'stock_qty' => 8]);
    }
}
