<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\DatabaseMessage;

class OrderStatusChangedNotification extends Notification
{
    use Queueable;

    protected $order;
    protected $oldStatus;
    protected $newStatus;

    public function __construct($order, $oldStatus, $newStatus)
    {
        $this->order = $order;
        $this->oldStatus = $oldStatus;
        $this->newStatus = $newStatus;
    }

    public function via($notifiable)
    {
        return ['database'];
    }

    public function toDatabase($notifiable)
    {
        return [
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'old_status' => $this->oldStatus,
            'new_status' => $this->newStatus,
            'message' => "Order status changed from {$this->oldStatus} to {$this->newStatus}",
        ];
    }
}
