<?php

namespace App\Services;

use Illuminate\Support\Facades\Mail;

class ResendEmailService
{
    public function send(
        string $to,
        string $subject,
        string $html
    ): array {
        Mail::html($html, function ($message) use ($to, $subject) {
            $message->to($to)
                ->subject($subject);
        });

        return ['sent' => true];
    }
}
