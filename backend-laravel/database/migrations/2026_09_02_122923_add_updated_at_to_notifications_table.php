<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // The initial schema already creates updated_at.
    }

    public function down(): void
    {
        // Keep updated_at because it belongs to the initial schema.
    }
};