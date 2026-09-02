<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Models\User;
use App\Notifications\VerifyEmailNotification;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $v = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|string|max:50',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($v->fails()) {
            return response()->json([
                'errors' => $v->errors()
            ], 422);
        }

        $user = User::create([
            'name' => trim($request->name),
            'email' => strtolower(trim($request->email)),
            'phone' => trim($request->phone),
            'password' => Hash::make($request->password),
            'role' => 'customer',
        ]);

        // Send email verification notification.
        $user->notify(
            new VerifyEmailNotification()
        );

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
    }

    public function login(Request $request)
    {
        $v = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
            'device_name' => 'sometimes|string',
        ]);

        if ($v->fails()) {
            return response()->json([
                'errors' => $v->errors()
            ], 422);
        }

        $user = User::where(
            'email',
            strtolower(trim($request->email))
        )->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        $device = $request->input(
            'device_name',
            'default'
        );

        $token = $user->createToken($device)
            ->plainTextToken;

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

    public function logout(Request $request)
    {
        $token = $request->user()->currentAccessToken();

        if ($token) {
            $token->delete();
        }

        return response()->json([
            'message' => 'Logged out'
        ]);
    }

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

    public function changePassword(Request $request)
    {
        $v = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if ($v->fails()) {
            return response()->json([
                'errors' => $v->errors()
            ], 422);
        }

        $user = $request->user();

        if (!Hash::check(
            $request->current_password,
            $user->password
        )) {
            return response()->json([
                'message' => 'Current password is incorrect'
            ], 403);
        }

        $user->password = Hash::make(
            $request->new_password
        );

        $user->save();

        return response()->json([
            'message' => 'Password changed successfully'
        ]);
    }
}

