<?php

use App\Models\User;
use App\Notifications\NewCustomerNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;

// Laravel welcome page
Route::get('/', function () {
    return view('welcome');
});

// Customer email verification
Route::get('/email/verify/{id}/{hash}', function ($id, $hash) {
    $user = User::findOrFail($id);

    // Confirm that the link belongs to this user's email address.
    if (!hash_equals(
        sha1($user->getEmailForVerification()),
        $hash
    )) {
        abort(403, 'Invalid email verification link.');
    }

    // Mark the customer's email as verified only once.
    if (!$user->hasVerifiedEmail()) {
        $user->markEmailAsVerified();

        // Notify administrators when a customer verifies their email.
        if ($user->role === 'customer') {
            User::where('role', 'admin')->get()->each(
                function ($admin) use ($user) {
                    try {
                        $admin->notify(
                            new NewCustomerNotification($user)
                        );
                    } catch (\Throwable $e) {
                        Log::error(
                            'New customer admin notification failed',
                            [
                                'admin_id' => $admin->id,
                                'exception' => get_class($e),
                            ]
                        );
                    }
                }
            );
        }
    }

    // Only customers can use the automatic sign-in handoff.
    abort_unless($user->role === 'customer', 403);

    // Generate a random, short-lived, single-use sign-in code.
    $plainCode = Str::random(64);

    DB::table('email_verification_handoffs')->insert([
        'user_id' => $user->id,
        'code_hash' => hash('sha256', $plainCode),
        'expires_at' => now()->addMinutes(5),
        'used_at' => null,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // Redirect to the customer frontend.
    $frontendUrl = rtrim(
        config(
            'app.frontend_url',
            env(
                'FRONTEND_URL',
                'https://wagi-app.netlify.app'
            )
        ),
        '/'
    );

    return redirect(
        $frontendUrl . '/auth?verification_code=' . urlencode($plainCode)
    );
})->middleware([
    'signed',
    'throttle:6,1',
])->name('verification.verify');
