<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Order;

class AdminReportsController extends Controller
{
    public function dailySales(Request $request)
    {
        $days = (int)$request->query('days', 30);
        $start = Carbon::today()->subDays($days - 1);

        $data = Order::select(DB::raw('date(created_at) as day'), DB::raw('sum(total) as total'))
            ->where('created_at', '>=', $start)
            ->where('status', '!=', 'cancelled')
            ->groupBy(DB::raw('date(created_at)'))
            ->orderBy('day')
            ->get();

        return response()->json($data);
    }

    public function monthlySales(Request $request)
    {
        $months = (int)$request->query('months', 12);
        $start = Carbon::now()->subMonths($months - 1)->startOfMonth();

        $data = Order::select(DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"), DB::raw('sum(total) as total'))
            ->where('created_at', '>=', $start)
            ->where('status', '!=', 'cancelled')
            ->groupBy(DB::raw("DATE_FORMAT(created_at, '%Y-%m')"))
            ->orderBy('month')
            ->get();

        return response()->json($data);
    }
}
