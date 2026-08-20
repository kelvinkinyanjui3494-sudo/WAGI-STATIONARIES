<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * This seeder expects the plaintext admin password to be provided via the
     * SEED_ADMIN_PASSWORD environment variable at runtime. The seeder will not
     * commit any plaintext password to the repository.
     *
     * Usage example (Linux/macOS):
     * SEED_ADMIN_EMAIL=wagistationaries2026@gmail.com SEED_ADMIN_NAME="WAGI Admin" \
     * SEED_ADMIN_PASSWORD='YourTempPassword' php artisan db:seed --class=Database\\Seeders\\AdminUserSeeder
     */
    public function run()
    {
        $email = env('SEED_ADMIN_EMAIL', 'wagistationaries2026@gmail.com');
        $name = env('SEED_ADMIN_NAME', 'WAGI Admin');
        $password = env('SEED_ADMIN_PASSWORD');

        if (empty($password)) {
            $this->command->error('SEED_ADMIN_PASSWORD is not set. Aborting AdminUserSeeder.');
            return;
        }

        // Find existing user by email or create new instance
        $user = User::where('email', $email)->first();

        if (!$user) {
            $user = new User();
            $user->email = $email;
        }

        $user->name = $name;
        $user->password = Hash::make($password);
        $user->role = 'admin';
        $user->email_verified_at = now();
        $user->remember_token = Str::random(10);
        $user->save();

        $this->command->info("Admin user ensured: {$email}");
    }
}
