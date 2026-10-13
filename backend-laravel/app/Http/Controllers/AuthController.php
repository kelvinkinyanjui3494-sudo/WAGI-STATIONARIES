<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Throwable;

class AuthController extends Controller
{
    /**
     * Register a new customer and send an email verification link.
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

            // Send the email verification notification.
            $user->notify(new VerifyEmailNotification());

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
            // Write the exception to Render's captured server error output.
            error_log(
                '[WAGI REGISTRATION ERROR] ' .
                get_class($e) . ': ' . $e->getMessage()
            );

            // Also record it through Laravel's configured logger.
            Log::error('Customer registration failed', [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
            ]);

            // Keep detailed exception information private.
            return response()->json([
                'message' => 'Registration failed. Please try again later.',
            ], 500);
        }
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

