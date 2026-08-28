<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class EmailVerificationController extends Controller
{
    /**
     * Verify the customer's email address.
     */
    public function verify(
        Request $request,
        int $id,
        string $hash
    ) {
        if (!$request->hasValidSignature()) {
            return redirect(
                config('app.frontend_url') .
                '/auth?verified=0&error=invalid'
            );
        }

        $user = User::find($id);

        if (!$user) {
            return redirect(
                config('app.frontend_url') .
                '/auth?verified=0&error=not-found'
            );
        }

        if (
            !hash_equals(
                sha1(
                    $user->getEmailForVerification()
                ),
                $hash
            )
        ) {
            return redirect(
                config('app.frontend_url') .
                '/auth?verified=0&error=invalid'
            );
        }

        if (!$user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        return redirect(
            config('app.frontend_url') .
            '/auth?verified=1'
        );
    }

    /**
     * Resend the customer's email verification message.
     */
    public function resend(
        Request $request
    ) {
        $request->validate([
            'email' =>
                'required|email',
        ]);

        $user = User::where(
            'email',
            $request->email
        )->first();

        if (!$user) {
            return response()->json([
                'message' =>
                    'If an account exists with this email address, a verification email will be sent.',
            ]);
        }

        if (
            $user->hasVerifiedEmail()
        ) {
            return response()->json([
                'message' =>
                    'Your email address is already verified.',
                'email_verified' =>
                    true,
            ]);
        }

        $user->notify(
            new \App\Notifications\CustomerVerifyEmail()
        );

        return response()->json([
            'message' =>
                'Verification email sent successfully.',
            'email_verified' =>
                false,
        ]);
    }
}
