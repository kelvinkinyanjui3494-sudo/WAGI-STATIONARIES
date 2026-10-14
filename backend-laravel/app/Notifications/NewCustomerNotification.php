<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
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
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => 'New Customer Verified',
            'message' => "A new customer, {$this->customer->name}, has verified their email and completed registration.",
            'customer_id' => $this->customer->id,
            'customer_name' => $this->customer->name,
            'customer_email' => $this->customer->email,
            'customer_phone' => $this->customer->phone,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('WAGI-STATIONARIES: New Customer Verified')
            ->greeting('Hello Administrator,')
            ->line('A new customer has verified their email address and completed registration.')
            ->line('Customer name: ' . $this->customer->name)
            ->line('Customer email: ' . $this->customer->email)
            ->line('Customer phone: ' . ($this->customer->phone ?: 'Not provided'))
            ->line('Customer ID: ' . $this->customer->id)
            ->line('The customer can now access the WAGI store.');
    }
}
