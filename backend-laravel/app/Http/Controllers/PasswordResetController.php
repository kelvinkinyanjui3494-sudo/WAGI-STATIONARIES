<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class PasswordResetController extends Controller
{
    public function forgot(Request $request)
    {
        $v = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($v->fails()) {
            return response()->json([
                'errors' => $v->errors()
            ], 422);
        }

        $email = strtolower(trim($request->email));

        // Remove any previous unused codes for this email.
        \DB::table('password_reset_codes')
            ->where('email', $email)
            ->whereNull('used_at')
            ->delete();

        // Generate a secure 6-digit verification code.
        $code = (string) random_int(100000, 999999);

        // Store only the hashed code in the database.
        \DB::table('password_reset_codes')->insert([
            'email' => $email,
            'code' => Hash::make($code),
            'expires_at' => now()->addMinutes(10),
            'used_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Mail::raw(
            "Your WAGI - STATIONARIES password reset verification code is: {$code}\n\n"
            . "This code will expire in 10 minutes.\n\n"
            . "If you did not request a password reset, you can ignore this email.",
            function ($message) use ($email) {
                $message
                    ->to($email)
                    ->subject('WAGI Password Reset Verification Code');
            }
        );

        return response()->json([
            'message' => 'Password reset verification code sent to your email.'
        ]);
    }

    public function verifyCode(Request $request)
    {
        $v = Validator::make($request->all(), [
            'email' => 'required|email',
            'code' => 'required|digits:6',
        ]);

        if ($v->fails()) {
            return response()->json([
                'errors' => $v->errors()
            ], 422);
        }

        $email = strtolower(trim($request->email));

        $resetCode = \DB::table('password_reset_codes')
            ->where('email', $email)
            ->whereNull('used_at')
            ->latest('created_at')
            ->first();

        if (!$resetCode) {
            return response()->json([
                'message' => 'Invalid or expired verification code.'
            ], 422);
        }

        if (now()->greaterThan($resetCode->expires_at)) {
            return response()->json([
                'message' => 'This verification code has expired. Please request a new code.'
            ], 422);
        }

        if (!Hash::check($request->code, $resetCode->code)) {
            return response()->json([
                'message' => 'Invalid verification code.'
            ], 422);
        }

        return response()->json([
            'message' => 'Verification code confirmed.'
        ]);
    }

    public function reset(Request $request)
    {
        $v = Validator::make($request->all(), [
            'email' => 'required|email',
            'code' => 'required|digits:6',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($v->fails()) {
            return response()->json([
                'errors' => $v->errors()
            ], 422);
        }

        $email = strtolower(trim($request->email));

        $resetCode = \DB::table('password_reset_codes')
            ->where('email', $email)
            ->whereNull('used_at')
            ->latest('created_at')
            ->first();

        if (!$resetCode) {
            return response()->json([
                'message' => 'Invalid or expired verification code.'
            ], 422);
        }

        if (now()->greaterThan($resetCode->expires_at)) {
            return response()->json([
                'message' => 'This verification code has expired. Please request a new code.'
            ], 422);
        }

        if (!Hash::check($request->code, $resetCode->code)) {
            return response()->json([
                'message' => 'Invalid verification code.'
            ], 422);
        }

        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'Unable to reset password.'
            ], 422);
        }

        $user->password = Hash::make($request->password);

        $user->setRememberToken(Str::random(60));

        $user->save();

        // Mark the verification code as used.
        \DB::table('password_reset_codes')
            ->where('id', $resetCode->id)
            ->update([
                'used_at' => now(),
                'updated_at' => now(),
            ]);

        return response()->json([
            'message' => 'Password has been reset successfully.'
        ]);
    }
}