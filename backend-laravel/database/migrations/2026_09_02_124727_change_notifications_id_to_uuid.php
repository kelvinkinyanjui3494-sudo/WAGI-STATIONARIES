<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // The initial schema already defines notifications.id as a UUID.
    }

    public function down(): void
    {
        // Keep the UUID definition established by the initial schema.
    }
};