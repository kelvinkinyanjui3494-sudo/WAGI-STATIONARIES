<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Models\User;

class AuthController extends Controller
{
    /**
     * Register a new customer account.
     * 
     * Required fields:
     * - name: Customer's full name
     * - email: Unique email address
     * - phone: Required phone number (Kenyan format)
     * - password: Secure password (min 8 characters)
     * - password_confirmation: Password confirmation
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
            return response()->json(['errors' => $v->errors()], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'role' => 'customer',
        ]);

        // Optionally send email verification (omitted until mail config is provided)

        $token = $user->createToken('api_token')->plainTextToken;

        return response()->json(['user' => $user, 'token' => $token], 201);
    }

    /**
     * Authenticate a customer and issue an API token.
     * 
     * Required fields:
     * - email: Customer's email address
     * - password: Customer's password
     * 
     * Optional fields:
     * - device_name: Device identifier for token management
     */
    public function login(Request $request)
    {
        $v = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
            'device_name' => 'sometimes|string',
        ]);

        if ($v->fails()) {
            return response()->json(['errors' => $v->errors()], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        // Revoke existing tokens for single-session policies if required
        // $user->tokens()->delete();

        $device = $request->input('device_name', 'default');
        $token = $user->createToken($device)->plainTextToken;

        return response()->json(['user' => $user, 'token' => $token]);
    }

    /**
     * Logout the authenticated customer.
     * 
     * Revokes the current API token.
     */
    public function logout(Request $request)
    {
        $user = $request->user();
        // Revoke current access token
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
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
     * 
     * Required fields:
     * - current_password: Current password for verification
     * - new_password: New password (min 8 characters)
     * - new_password_confirmation: Password confirmation
     */
    public function changePassword(Request $request)
    {
        $v = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if ($v->fails()) {
            return response()->json(['errors' => $v->errors()], 422);
        }

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect'], 403);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json(['message' => 'Password changed successfully']);
    }
}
