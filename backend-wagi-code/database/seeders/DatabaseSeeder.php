<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * This file calls individual seeders. The AdminUserSeeder reads the admin
     * password from the SEED_ADMIN_PASSWORD environment variable at runtime.
     */
    public function run()
    {
        // $this->call(UsersTableSeeder::class);
        $this->call(AdminUserSeeder::class);
    }
}
