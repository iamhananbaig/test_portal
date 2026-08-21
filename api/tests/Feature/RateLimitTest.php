<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

it('rate limits login attempts', function () {
    User::factory()->create([
        'email' => 'ratelimit@test.com',
        'password' => Hash::make('password'),
    ]);

    RateLimiter::clear('login');

    $responses = [];
    for ($i = 0; $i < 10; $i++) {
        $responses[] = $this->postJson('/api/auth/login', [
            'email' => 'ratelimit@test.com',
            'password' => 'wrong-password',
        ]);
    }

    $this->assertTrue(
        collect($responses)->contains(fn ($r) => $r->status() === 429),
        'Expected at least one 429 Too Many Requests response'
    );
});

it('rate limits admin api requests', function () {
    $user = User::factory()->create();
    $token = auth('api')->login($user);

    RateLimiter::clear('admin');

    $responses = [];
    for ($i = 0; $i < 200; $i++) {
        $responses[] = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/categories');
    }

    $this->assertTrue(
        collect($responses)->contains(fn ($r) => $r->status() === 429),
        'Expected at least one 429 Too Many Requests response'
    );
});
