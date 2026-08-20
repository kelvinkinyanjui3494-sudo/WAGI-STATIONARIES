<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Product;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class AdminProductTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_product_and_upload_image()
    {
        Storage::fake('public');

        $admin = User::factory()->create(['role' => 'admin']);
        \Laravel\Sanctum\Sanctum::actingAs($admin, ['*']);

        $payload = [
            'name' => 'New Product',
            'sku' => 'NP-001',
            'price' => 250.00,
            'stock_qty' => 15,
        ];

        $res = $this->postJson('/api/admin/products', $payload);
        $res->assertStatus(201)->assertJsonFragment(['sku' => 'NP-001']);

        $productId = $res->json('id');

        // upload image
        $file = UploadedFile::fake()->image('photo.jpg');
        $upload = $this->postJson("/api/admin/products/{$productId}/images", ['image' => $file]);
        $upload->assertStatus(201);

        // ensure file was stored
        Storage::disk('public')->assertExists('products/NP-001/'.$upload->json('path')); // path may include filename
    }
}
