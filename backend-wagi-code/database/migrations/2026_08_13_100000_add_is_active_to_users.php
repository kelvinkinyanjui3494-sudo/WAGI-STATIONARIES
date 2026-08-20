<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddIsActiveToUsers extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds an is_active flag to users so admins can suspend/activate accounts.
     */
    public function up()
    {
        if (!Schema::hasColumn('users', 'is_active')) {
            Schema::table('users', function (Blueprint $table) {
                $table->boolean('is_active')->default(true)->after('role');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        if (Schema::hasColumn('users', 'is_active')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('is_active');
            });
        }
    }
}
