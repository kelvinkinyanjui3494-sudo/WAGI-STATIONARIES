<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Order;
use App\Models\User;
use App\Models\Product;

class AdminStatsController extends Controller
{
    public function index(Request $request)
    {
        // Total sales (sum of orders.total where payment_status = 'completed' or status != 'cancelled')
        $totalSales = Order::where('status', '!=', 'cancelled')->sum('total');

        // Today's sales
        $today = Carbon::today();
        $todaysSales = Order::whereDate('created_at', $today)->where('status', '!=', 'cancelled')->sum('total');

        // Monthly sales (current month)
        $startOfMonth = Carbon::now()->startOfMonth();
        $monthlySales = Order::where('created_at', '>=', $startOfMonth)->where('status', '!=', 'cancelled')->sum('total');

        $totalCustomers = User::where('role', 'customer')->count();
        $totalProducts = Product::count();

        $pendingOrders = Order::where('status', 'pending')->count();
        $processingOrders = Order::where('status', 'processing')->count();
        $deliveredOrders = Order::where('status', 'delivered')->count();
        $cancelledOrders = Order::where('status', 'cancelled')->count();

        $lowStockProducts = Product::where('stock_qty', '<=', 5)->count();
        $outOfStockProducts = Product::where('stock_qty', '<=', 0)->count();

        return response()->json([
            'total_sales' => (float)$totalSales,
            'todays_sales' => (float)$todaysSales,
            'monthly_sales' => (float)$monthlySales,
            'total_customers' => $totalCustomers,
            'total_products' => $totalProducts,
            'pending_orders' => $pendingOrders,
            'processing_orders' => $processingOrders,
            'delivered_orders' => $deliveredOrders,
            'cancelled_orders' => $cancelledOrders,
            'low_stock_products' => $lowStockProducts,
            'out_of_stock_products' => $outOfStockProducts,
        ]);
    }
}
