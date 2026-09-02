<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewOrderNotification extends Notification
{
    use Queueable;

    protected $order;

    public function __construct($order)
    {
        $this->order = $order;
    }

    /**
     * Get the notification delivery channels.
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Store the notification in the database.
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => 'New Order Received',
            'message' => "New order {$this->order->order_number} has been placed.",
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'customer_id' => $this->order->user_id,
            'total' => $this->order->total,
            'payment_method' => $this->order->payment_method,
        ];
    }
}