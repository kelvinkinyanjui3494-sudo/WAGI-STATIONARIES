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
        $apiKey = config('services.mailjet.key');
        $apiSecret = config('services.mailjet.secret');

        if (empty($apiKey) || empty($apiSecret)) {
            throw new RuntimeException(
                'Mailjet API credentials are not configured.'
            );
        }

        $fromAddress = config('mail.from.address');
        $fromName = config('mail.from.name', 'WAGI-STATIONARIES');

        if (empty($fromAddress) || $fromAddress === 'hello@example.com') {
            throw new RuntimeException(
                'The WAGI sender email address is not configured.'
            );
        }

        $response = Http::withBasicAuth($apiKey, $apiSecret)
            ->acceptJson()
            ->timeout(30)
            ->post('https://api.mailjet.com/v3.1/send', [
                'Messages' => [
                    [
                        'From' => [
                            'Email' => $fromAddress,
                            'Name' => $fromName,
                        ],
                        'To' => [
                            ['Email' => $to],
                        ],
                        'Subject' => $subject,
                        'HTMLPart' => $html,
                    ],
                ],
            ]);

        if ($response->failed()) {
            throw new RuntimeException(
                'Mailjet API returned HTTP '
                . $response->status()
                . ': '
                . $response->json(
                    'ErrorMessage',
                    'Email delivery request failed.'
                )
            );
        }

        $result = $response->json();

        if (($result['Messages'][0]['Status'] ?? null) !== 'success') {
            throw new RuntimeException(
                'Mailjet did not confirm acceptance of the email.'
            );
        }

        return $result;
    }
}
