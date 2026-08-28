<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;

class OrderController extends Controller
{
    /**
     * Return orders belonging only to the authenticated customer.
     */
    public function index(Request $request)
    {
        $orders = Order::with(['items', 'payments'])
            ->where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(30);

        return response()->json($orders);
    }

    /**
     * Return one order belonging only to the authenticated customer.
     */
    public function show(Request $request, $id)
    {
        $order = Order::with(['items', 'payments'])
            ->where('user_id', $request->user()->id)
            ->where('id', $id)
            ->firstOrFail();

        return response()->json($order);
    }
}
