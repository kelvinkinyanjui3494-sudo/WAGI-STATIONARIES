<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AdminNotificationsController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->query('per_page', 30);

        $notifications = $request->user()
            ->notifications()
            ->latest()
            ->paginate($perPage);

        $notifications->getCollection()->transform(function ($notification) {
            $data = $notification->data ?? [];

            return [
                'id' => $notification->id,
                'type' => $notification->type,
                'title' => $data['title'] ?? 'Notification',
                'message' => $data['message'] ?? 'New WAGI Stationeries update.',
                'created_at' => $notification->created_at,
                'read_at' => $notification->read_at,

                // Keep the original notification data available
                // for future use by the frontend.
                'data' => $data,
            ];
        });

        return response()->json($notifications);
    }

    public function markRead(Request $request, $id)
    {
        $notification = $request->user()
            ->notifications()
            ->where('id', $id)
            ->firstOrFail();

        $notification->markAsRead();

        return response()->json([
            'marked' => true,
        ]);
    }
}