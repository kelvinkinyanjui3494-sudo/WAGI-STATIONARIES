<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AppServiceProvider extends ServiceProvider
{
    public function register()
    {
        //
    }

    public function boot()
    {
        // Ensure Gate for admin
        Gate::define('access-admin', function ($user) {
            return $user && $user->role === 'admin';
        });
    }
}
