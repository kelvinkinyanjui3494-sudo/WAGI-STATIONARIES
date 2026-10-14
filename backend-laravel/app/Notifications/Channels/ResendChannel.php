<?php

namespace App\Notifications\Channels;

use App\Services\ResendEmailService;
use Illuminate\Notifications\Notification;

class ResendChannel
{
    public function send($notifiable, Notification $notification): void
    {
        $message = $notification->toResend($notifiable);

        app(ResendEmailService::class)->send(
            $message['to'],
            $message['subject'],
            $message['html']
        );
    }
}
