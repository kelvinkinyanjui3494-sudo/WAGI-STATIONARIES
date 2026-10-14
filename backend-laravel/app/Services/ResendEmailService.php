<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class ResendEmailService
{
    public function send(
        string $to,
        string $subject,
        string $html
    ): array {
        $apiKey = config('services.resend.key');
        $fromAddress = config('mail.from.address');
        $fromName = config('mail.from.name');

        if (empty($apiKey)) {
            throw new RuntimeException(
                'Resend API key is not configured.'
            );
        }

        if (
            empty($fromAddress) ||
            $fromAddress === 'hello@example.com'
        ) {
            throw new RuntimeException(
                'A valid sender email address is not configured.'
            );
        }

        $response = Http::acceptJson()
            ->withToken($apiKey)
            ->timeout(20)
            ->post('https://api.resend.com/emails', [
                'from' => $fromName
                    ? "{$fromName} <{$fromAddress}>"
                    : $fromAddress,
                'to' => [$to],
                'subject' => $subject,
                'html' => $html,
            ]);

        if ($response->failed()) {
            throw new RuntimeException(
                'Resend API returned HTTP '
                . $response->status()
                . ': '
                . $response->json(
                    'message',
                    'Email delivery request failed.'
                )
            );
        }

        return $response->json() ?? ['sent' => true];
    }
}
