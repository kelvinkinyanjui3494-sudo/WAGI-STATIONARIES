<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Order;
use App\Models\Payment;
use App\Services\InventoryService;

class AdminOrderController extends Controller
{
    public function index(Request $request)
    {
        $orders = Order::with('items','payments')->orderBy('created_at','desc')->paginate(30);
        return response()->json($orders);
    }

    public function show(Request $request, $id)
    {
        $order = Order::with('items','payments')->findOrFail($id);
        return response()->json($order);
    }

    public function updateStatus(Request $request, $id)
    {
        $v = Validator::make($request->all(), [
            'status' => 'required|string',
        ]);
        if ($v->fails()) return response()->json(['errors' => $v->errors()], 422);

        $order = Order::findOrFail($id);
        $old = $order->status;
        $order->status = $request->status;
        $order->save();

        // if the admin cancels the order, restock items
        if ($request->status === 'cancelled') {
            foreach ($order->items as $it) {
                InventoryService::increaseStock($it->product_id, $it->quantity, 'order_cancelled');
            }
        }

        // create notification row (notifications table)
        $order->user->notify(new \App\Notifications\OrderStatusChangedNotification($order, $old, $request->status));

        return response()->json(['message' => 'Order status updated', 'order' => $order]);
    }
}
