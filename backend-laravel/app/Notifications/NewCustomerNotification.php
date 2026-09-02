<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewCustomerNotification extends Notification
{
    use Queueable;

    protected $customer;

    public function __construct($customer)
    {
        $this->customer = $customer;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => 'New Customer Registered',
            'message' => "A new customer, {$this->customer->name}, has created an account.",
            'customer_id' => $this->customer->id,
            'customer_name' => $this->customer->name,
            'customer_email' => $this->customer->email,
            'customer_phone' => $this->customer->phone,
        ];
    }
}