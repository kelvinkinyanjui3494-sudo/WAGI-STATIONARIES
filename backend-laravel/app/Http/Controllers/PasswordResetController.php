<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Validator;

class PasswordResetController extends Controller
{
    public function forgot(Request $request)
    {
        $v = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($v->fails()) {
            return response()->json(['errors' => $v->errors()], 422);
        }

        $status = Password::sendResetLink($request->only('email'));

        if ($status == Password::RESET_LINK_SENT) {
            return response()->json(['message' => 'Password reset link sent']);
        }

        return response()->json(['message' => 'Unable to send reset link'], 500);
    }

    public function reset(Request $request)
    {
        $v = Validator::make($request->all(), [
            'token' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($v->fails()) {
            return response()->json(['errors' => $v->errors()], 422);
        }

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->password = bcrypt($password);
                $user->setRememberToken(\Illuminate\Support\Str::random(60));
                $user->save();
            }
        );

        if ($status == Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Password has been reset']);
        }

        return response()->json(['message' => 'Failed to reset password'], 500);
    }
}
