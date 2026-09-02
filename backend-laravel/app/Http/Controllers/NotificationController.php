<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function unreadCount(Request $request)
    {
        $count = $request->user()
            ->unreadNotifications()
            ->count();

        return response()->json([
            'unread' => $count,
        ]);
    }

    public function index(Request $request)
    {
        $notifications = $request->user()
            ->notifications()
            ->latest()
            ->paginate(30);

        $notifications->getCollection()->transform(function ($notification) {
            $data = $notification->data ?? [];

            return [
                'id' => $notification->id,
                'type' => $notification->type,
                'title' => $data['title'] ?? 'Order Update',
                'message' => $data['message'] ?? 'You have a new WAGI Stationeries update.',
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