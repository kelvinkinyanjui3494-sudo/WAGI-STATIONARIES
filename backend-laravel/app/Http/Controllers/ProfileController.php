<?php

namespace App\Http\Controllers;

use App\Models\Address;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'user' => $user,
            'address' => $user->addresses()->latest('id')->first(),
        ]);
    }

    public function update(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'alt_phone' => 'nullable|string|max:50',

            'county' => 'nullable|string|max:120',
            'town' => 'nullable|string|max:120',
            'estate' => 'nullable|string|max:120',
            'street' => 'nullable|string|max:120',
            'building' => 'nullable|string|max:120',
            'house_number' => 'nullable|string|max:120',
            'landmark' => 'nullable|string|max:120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        $user->update([
            'name' => $request->name,
            'phone' => $request->phone,
            'alt_phone' => $request->alt_phone,
        ]);

        $address = $user->addresses()->first();

        if (!$address) {
            $address = new Address([
                'user_id' => $user->id,
            ]);
        }

        $address->fill([
            'county' => $request->county,
            'town' => $request->town,
            'estate' => $request->estate,
            'street' => $request->street,
            'building' => $request->building,
            'house_number' => $request->house_number,
            'nearest_landmark' => $request->landmark,
        ]);

        $address->user_id = $user->id;
        $address->save();

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user->fresh(),
            'address' => $address->fresh(),
        ]);
    }
}