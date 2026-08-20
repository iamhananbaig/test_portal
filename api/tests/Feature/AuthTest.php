<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

it('logs in with valid credentials', function () {
    User::factory()->create([
        'email' => 'admin@test.com',
        'password' => Hash::make('password'),
    ]);

    $response = $this->postJson('/api/auth/login', [
        'email' => 'admin@test.com',
        'password' => 'password',
    ]);

    $response->assertOk()
        ->assertJsonStructure(['user' => ['id', 'name', 'email'], 'token']);
});

it('rejects invalid credentials', function () {
    User::factory()->create([
        'email' => 'admin@test.com',
        'password' => Hash::make('password'),
    ]);

    $response = $this->postJson('/api/auth/login', [
        'email' => 'admin@test.com',
        'password' => 'wrong-password',
    ]);

    $response->assertUnauthorized();
});

it('returns current user', function () {
    $user = User::factory()->create();
    $token = auth('api')->login($user);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/auth/me');

    $response->assertOk()
        ->assertJsonFragment(['email' => $user->email]);
});

it('logs out', function () {
    $user = User::factory()->create();
    $token = auth('api')->login($user);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/auth/logout');

    $response->assertOk();
});

it('requires authentication for protected routes', function () {
    $response = $this->getJson('/api/categories');

    $response->assertUnauthorized();
});
