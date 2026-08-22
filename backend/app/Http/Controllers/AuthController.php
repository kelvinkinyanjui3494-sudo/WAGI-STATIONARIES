<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Models\User;
use App\Notifications\CustomerVerifyEmail;

class AuthController extends Controller
{
    /**
     * Register a new customer account.
     */
    public function register(Request $request)
    {
        $v = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|string|max:30',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($v->fails()) {
            return response()->json([
                'errors' => $v->errors(),
            ], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'role' => 'customer',
        ]);

        // Send email verification notification.
        $user->notify(new CustomerVerifyEmail());

        return response()->json([
            'message' => 'Account created successfully. Please verify your email address before signing in.',
            'user' => $user,
            'email_verified' => false,
        ], 201);
    }

    /**
     * Authenticate a customer and issue an API token.
     */
    public function login(Request $request)
    {
        $v = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
            'device_name' => 'sometimes|string',
        ]);

        if ($v->fails()) {
            return response()->json([
                'errors' => $v->errors(),
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials',
            ], 401);
        }

        // Customers must verify their email before signing in.
        // Administrators are not blocked by email verification.
        if (
            $user->role === 'customer' &&
            !$user->hasVerifiedEmail()
        ) {
            return response()->json([
                'message' => 'Please verify your email address before signing in.',
                'email_verified' => false,
            ], 403);
        }

        // Revoke existing tokens for single-session policies if required.
        // $user->tokens()->delete();

        $device = $request->input('device_name', 'default');
        $token = $user->createToken($device)->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * Logout the authenticated customer.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out',
        ]);
    }

    /**
     * Get the authenticated customer's profile.
     */
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    /**
     * Change the authenticated customer's password.
     */
    public function changePassword(Request $request)
    {
        $v = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if ($v->fails()) {
            return response()->json([
                'errors' => $v->errors(),
            ], 422);
        }

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect',
            ], 403);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'message' => 'Password changed successfully',
        ]);
    }
}