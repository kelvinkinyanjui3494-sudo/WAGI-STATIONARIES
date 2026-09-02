<?php

use App\Models\User;
use App\Notifications\NewCustomerNotification;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

/*
|--------------------------------------------------------------------------
| Email Verification
|--------------------------------------------------------------------------
*/

Route::get('/email/verify/{id}/{hash}', function (
    $id,
    $hash
) {
    $user = User::findOrFail($id);

    // Confirm that the signed URL contains the correct email hash.
    if (!hash_equals(
        sha1($user->getEmailForVerification()),
        $hash
    )) {
        abort(403, 'Invalid email verification link.');
    }

    // Verify the customer's email if it has not already been verified.
    if (!$user->hasVerifiedEmail()) {
        $user->markEmailAsVerified();

        // Notify all administrators only after successful verification.
        User::where('role', 'admin')
            ->get()
            ->each(function ($admin) use ($user) {
                $admin->notify(
                    new NewCustomerNotification($user)
                );
            });
    }

    return redirect(
        rtrim(
            env('FRONTEND_URL', 'http://localhost:5173'),
            '/'
        ) . '/auth?verified=1'
    );
})->middleware([
    'signed',
    'throttle:6,1',
])->name('verification.verify');