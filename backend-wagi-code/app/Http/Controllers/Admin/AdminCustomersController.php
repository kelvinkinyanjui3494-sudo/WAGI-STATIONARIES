<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\User;

class AdminCustomersController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->query('q');
        $perPage = (int)$request->query('per_page', 20);

        $query = User::where('role', 'customer');

        if ($q) {
            $query->where(function ($sub) use ($q) {
                $sub->where('name', 'like', "%{$q}%")->orWhere('email', 'like', "%{$q}%")->orWhere('phone', 'like', "%{$q}%");
            });
        }

        $data = $query->orderBy('created_at', 'desc')->paginate($perPage);
        return response()->json($data);
    }

    public function show($id)
    {
        $user = User::where('role', 'customer')->findOrFail($id);
        return response()->json($user);
    }

    public function update(Request $request, $id)
    {
        $user = User::where('role', 'customer')->findOrFail($id);

        $v = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,'.$user->id,
            'phone' => 'sometimes|string|max:50',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($v->fails()) return response()->json(['errors' => $v->errors()], 422);

        $user->update($request->only(['name','email','phone','is_active']));

        return response()->json($user);
    }

    public function destroy($id)
    {
        $user = User::where('role', 'customer')->findOrFail($id);
        $user->delete();
        return response()->json(['deleted' => true]);
    }
}
