<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds customer-specific fields to the users table:
     * - phone: Required phone number (Kenyan format)
     * - alt_phone: Optional alternate phone number
     * - profile_picture: Optional profile picture URL
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('password');
            $table->string('alt_phone')->nullable()->after('phone');
            $table->string('profile_picture')->nullable()->after('role');
        });
    }

    /**
     * Reverse the migrations.
     * 
     * Drops the customer fields from the users table.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['phone', 'alt_phone', 'profile_picture']);
        });
    }
};
