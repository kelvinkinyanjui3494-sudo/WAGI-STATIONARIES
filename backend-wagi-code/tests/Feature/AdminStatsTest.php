<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;

class AdminStatsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_stats_endpoint()
    {
        // create admin
        $admin = User::factory()->create(['role' => 'admin']);

        // create customers and orders
        $cust = User::factory()->create(['role' => 'customer']);
        $product = Product::create(['name' => 'P1','slug'=>'p1','sku'=>'P1','price'=>100,'stock_qty'=>10]);

        $order = Order::create(['order_number'=>'WAGI-TEST','user_id'=>$cust->id,'status'=>'pending','payment_status'=>'unpaid','subtotal'=>100,'total'=>100]);
        OrderItem::create(['order_id'=>$order->id,'product_id'=>$product->id,'product_name'=>$product->name,'sku'=>$product->sku,'quantity'=>1,'unit_price'=>100,'total_price'=>100]);

        // act as admin
        \Laravel\Sanctum\Sanctum::actingAs($admin, ['*']);

        $res = $this->getJson('/api/admin/stats');
        $res->assertStatus(200)->assertJsonStructure(['total_sales','todays_sales','monthly_sales','total_customers','total_products']);
    }
}
