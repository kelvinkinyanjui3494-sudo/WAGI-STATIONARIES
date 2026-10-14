<?php

namespace App\Notifications;

use App\Notifications\Channels\ResendChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

class VerifyEmailNotification extends Notification
{
    use Queueable;

    public function via($notifiable): array
    {
        return [ResendChannel::class];
    }

    public function toResend($notifiable): array
    {
        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1(
                    $notifiable->getEmailForVerification()
                ),
            ]
        );

        $html = '
            <h2>Welcome to WAGI - STATIONARIES!</h2>
            <p>Thank you for creating your WAGI customer account.</p>
            <p>Please confirm your email address by clicking below.</p>
            <p>
                <a href="' . e($verificationUrl) . '"
                   style="display:inline-block;padding:12px 20px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;">
                    Verify Email Address
                </a>
            </p>
            <p>This verification link will expire in 60 minutes.</p>
            <p>If you did not create a WAGI account, you can ignore this email.</p>
        ';

        return [
            'to' => $notifiable->getEmailForVerification(),
            'subject' => 'Verify your WAGI email address',
            'html' => $html,
        ];
    }
}
