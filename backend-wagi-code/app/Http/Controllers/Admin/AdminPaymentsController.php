<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Payment;

class AdminPaymentsController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int)$request->query('per_page', 20);
        $q = $request->query('q');

        $query = Payment::with('order');
        if ($q) $query->where('transaction_id', 'like', "%{$q}%")->orWhere('method', 'like', "%{$q}%");

        return response()->json($query->orderBy('created_at','desc')->paginate($perPage));
    }

    public function updateStatus(Request $request, $id)
    {
        $v = Validator::make($request->all(), [
            'status' => 'required|string',
            'transaction_id' => 'sometimes|string',
        ]);
        if ($v->fails()) return response()->json(['errors'=>$v->errors()],422);

        $payment = Payment::findOrFail($id);
        $payment->status = $request->status;
        if ($request->has('transaction_id')) $payment->transaction_id = $request->transaction_id;
        $payment->save();

        // update order payment_status accordingly
        if ($payment->order) {
            $payment->order->payment_status = $payment->status === 'completed' ? 'paid' : $payment->status;
            if ($payment->status === 'completed') $payment->order->status = 'processing';
            $payment->order->save();
        }

        return response()->json($payment);
    }
}
