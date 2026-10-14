<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Throwable;

class AuthController extends Controller
{
    /**
     * Register a customer and send an email verification link.
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'phone' => 'required|string|max:50',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Please correct the information provided.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = User::create([
                'name' => trim($request->input('name')),
                'email' => strtolower(trim($request->input('email'))),
                'phone' => trim($request->input('phone')),
                'password' => Hash::make($request->input('password')),
                'role' => 'customer',
            ]);

            try {
                $user->notify(new VerifyEmailNotification());
            } catch (Throwable $e) {
                Log::error('Customer verification email failed', [
                    'user_id' => $user->id,
                    'exception' => get_class($e),
                ]);

                return response()->json([
                    'message' => 'Your account was created but the verification email could not be sent. Please use the resend verification option.',
                    'pending_verification' => true,
                ], 503);
            }

            return response()->json([
                'message' => 'Account created successfully. Please check your email to verify your account.',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'role' => $user->role,
                    'email_verified_at' => $user->email_verified_at,
                ],
                'email_verified' => false,
            ], 201);
        } catch (Throwable $e) {
            Log::error('Customer registration failed', [
                'exception' => get_class($e),
            ]);

            return response()->json([
                'message' => 'Registration failed. Please try again later.',
            ], 500);
        }
    }

    /**
     * Resend a customer email verification link.
     */
    public function resendVerificationEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Please provide a valid email address.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $email = strtolower(trim($request->input('email')));

        $user = User::where('email', $email)
            ->where('role', 'customer')
            ->first();

        if ($user && !$user->hasVerifiedEmail()) {
            try {
                $user->notify(new VerifyEmailNotification());
            } catch (Throwable $e) {
                Log::error('Resend verification email failed', [
                    'user_id' => $user->id,
                    'exception' => get_class($e),
                ]);
            }
        }

        return response()->json([
            'message' => 'If the account exists and needs verification, a verification email will be sent.',
        ]);
    }

    /**
     * Authenticate a customer or administrator.
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
            'device_name' => 'sometimes|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Please check your login information.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::where(
            'email',
            strtolower(trim($request->input('email')))
        )->first();

        if (
            !$user ||
            !Hash::check($request->input('password'), $user->password)
        ) {
            return response()->json([
                'message' => 'Invalid credentials',
            ], 401);
        }

        // Only unverified customers are blocked. Admin login remains intact.
        if ($user->role === 'customer' && !$user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Please verify your email address before signing in.',
            ], 403);
        }

        $device = $request->input('device_name', 'default');
        $token = $user->createToken($device)->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'email_verified_at' => $user->email_verified_at,
            ],
            'token' => $token,
        ]);
    }

    /**
     * Exchange a short-lived, single-use verification code for a login token.
     */
    public function completeEmailVerification(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|size:64',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'The verification session is invalid or has expired. Please open your verification email again.',
            ], 422);
        }

        try {
            $result = DB::transaction(function () use ($request) {
                $handoff = DB::table('email_verification_handoffs')
                    ->where(
                        'code_hash',
                        hash('sha256', $request->input('code'))
                    )
                    ->lockForUpdate()
                    ->first();

                if (
                    !$handoff ||
                    $handoff->used_at !== null ||
                    now()->greaterThanOrEqualTo($handoff->expires_at)
                ) {
                    return null;
                }

                $user = User::find($handoff->user_id);

                if (
                    !$user ||
                    $user->role !== 'customer' ||
                    !$user->hasVerifiedEmail()
                ) {
                    return null;
                }

                DB::table('email_verification_handoffs')
                    ->where('id', $handoff->id)
                    ->update([
                        'used_at' => now(),
                        'updated_at' => now(),
                    ]);

                $token = $user->createToken(
                    'WAGI Customer Web'
                )->plainTextToken;

                return [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'phone' => $user->phone,
                        'role' => $user->role,
                        'email_verified_at' => $user->email_verified_at,
                    ],
                    'token' => $token,
                ];
            });

            if (!$result) {
                return response()->json([
                    'message' => 'The verification session is invalid or has expired. Please open your verification email again.',
                ], 422);
            }

            return response()->json($result);
        } catch (Throwable $e) {
            Log::error('Automatic customer login failed', [
                'exception' => get_class($e),
            ]);

            return response()->json([
                'message' => 'Automatic sign-in could not be completed. Please try signing in again.',
            ], 500);
        }
    }

    /**
     * Log out the currently authenticated user.
     */
    public function logout(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $token = $user->currentAccessToken();

        if ($token) {
            $token->delete();
        }

        return response()->json([
            'message' => 'Logged out',
        ]);
    }

    /**
     * Return the authenticated user's profile.
     */
    public function me(Request $request)
    {
        $user = $request->user()->load('addresses');

        $address = $user->addresses
            ->sortByDesc('created_at')
            ->first();

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'alt_phone' => $user->alt_phone,
            'role' => $user->role,
            'profile_picture' => $user->profile_picture,
            'email_verified_at' => $user->email_verified_at,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
            'address' => $address,
        ]);
    }

    /**
     * Change the authenticated user's password.
     */
    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Please correct the information provided.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        if (!Hash::check(
            $request->input('current_password'),
            $user->password
        )) {
            return response()->json([
                'message' => 'Current password is incorrect',
            ], 403);
        }

        $user->password = Hash::make(
            $request->input('new_password')
        );

        $user->save();

        return response()->json([
            'message' => 'Password changed successfully',
        ]);
    }
}
