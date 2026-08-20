<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AdminNotificationsController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int)$request->query('per_page', 30);
        $notifications = $request->user()->notifications()->paginate($perPage);
        return response()->json($notifications);
    }

    public function markRead(Request $request, $id)
    {
        $notif = $request->user()->notifications()->where('id', $id)->firstOrFail();
        $notif->markAsRead();
        return response()->json(['marked' => true]);
    }
}
