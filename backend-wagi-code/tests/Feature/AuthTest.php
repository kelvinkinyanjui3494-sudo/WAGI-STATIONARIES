<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_and_login_flow()
    {
        $payload = [
            'name' => 'Test User',
            'email' => 'testuser@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ];

        $this->postJson('/api/auth/register', $payload)->assertStatus(201)->assertJsonStructure(['user','token']);

        $login = [
            'email' => 'testuser@example.com',
            'password' => 'Password123!'
        ];

        $this->postJson('/api/auth/login', $login)->assertStatus(200)->assertJsonStructure(['user','token']);
    }
}
