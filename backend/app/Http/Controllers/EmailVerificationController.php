<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Notifications\CustomerVerifyEmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;

class EmailVerificationController extends Controller
{
    /**
     * Verify the customer's email address.
     */
    public function verify(Request $request, int $id, string $hash)
    {
        if (!$request->hasValidSignature()) {
            return response()->json([
                'message' => 'The verification link is invalid or has expired.',
            ], 403);
        }

        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'message' => 'Customer account not found.',
            ], 404);
        }

        if (!hash_equals(
            sha1($user->getEmailForVerification()),
            $hash
        )) {
            return response()->json([
                'message' => 'The verification link is invalid.',
            ], 403);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Your email address is already verified.',
                'email_verified' => true,
            ]);
        }

        $user->markEmailAsVerified();

        return response()->json([
            'message' => 'Email address verified successfully. You can now sign in.',
            'email_verified' => true,
        ]);
    }

    /**
     * Resend the customer's email verification message.
     */
    public function resend(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'If an account exists with this email address, a verification email will be sent.',
            ]);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Your email address is already verified.',
                'email_verified' => true,
            ]);
        }

        $user->notify(new CustomerVerifyEmail());

        return response()->json([
            'message' => 'Verification email sent successfully.',
            'email_verified' => false,
        ]);
    }
}