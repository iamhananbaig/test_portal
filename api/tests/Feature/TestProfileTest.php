<?php

use App\Models\Category;
use App\Models\TestProfile;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->token = auth('api')->login($this->user);
    $this->headers = ['Authorization' => "Bearer {$this->token}"];

    $this->categories = Category::factory()->count(3)->create();
});

it('lists test profiles', function () {
    $profile = TestProfile::factory()->create();
    $profile->categories()->create([
        'category_id' => $this->categories->first()->id,
        'question_count' => 5,
    ]);

    $response = $this->withHeaders($this->headers)
        ->getJson('/api/test-profiles');

    $response->assertOk()
        ->assertJsonCount(1, 'data');
});

it('creates a test profile with categories', function () {
    $payload = [
        'name' => 'General Aptitude',
        'duration_minutes' => 60,
        'categories' => [
            ['category_id' => $this->categories[0]->id, 'question_count' => 10],
            ['category_id' => $this->categories[1]->id, 'question_count' => 5],
        ],
    ];

    $response = $this->withHeaders($this->headers)
        ->postJson('/api/test-profiles', $payload);

    $response->assertCreated()
        ->assertJsonFragment(['name' => 'General Aptitude'])
        ->assertJsonFragment(['duration_minutes' => 60]);

    $this->assertDatabaseHas('test_profiles', ['name' => 'General Aptitude']);
    $this->assertDatabaseHas('test_profile_categories', [
        'category_id' => $this->categories[0]->id,
        'question_count' => 10,
    ]);
});

it('shows a single test profile', function () {
    $profile = TestProfile::factory()->create(['name' => 'Technical Assessment']);
    $profile->categories()->create([
        'category_id' => $this->categories->first()->id,
        'question_count' => 8,
    ]);

    $response = $this->withHeaders($this->headers)
        ->getJson("/api/test-profiles/{$profile->id}");

    $response->assertOk()
        ->assertJsonFragment(['name' => 'Technical Assessment']);
});

it('updates a test profile', function () {
    $profile = TestProfile::factory()->create(['name' => 'Old Name']);
    $profile->categories()->create([
        'category_id' => $this->categories->first()->id,
        'question_count' => 5,
    ]);

    $payload = [
        'name' => 'New Name',
        'duration_minutes' => 45,
        'categories' => [
            ['category_id' => $this->categories[2]->id, 'question_count' => 15],
        ],
    ];

    $response = $this->withHeaders($this->headers)
        ->putJson("/api/test-profiles/{$profile->id}", $payload);

    $response->assertOk()
        ->assertJsonFragment(['name' => 'New Name']);

    $this->assertDatabaseHas('test_profiles', ['id' => $profile->id, 'name' => 'New Name']);
    $this->assertDatabaseHas('test_profile_categories', [
        'test_profile_id' => $profile->id,
        'category_id' => $this->categories[2]->id,
        'question_count' => 15,
    ]);
    $this->assertDatabaseMissing('test_profile_categories', [
        'test_profile_id' => $profile->id,
        'category_id' => $this->categories->first()->id,
    ]);
});

it('deletes a test profile', function () {
    $profile = TestProfile::factory()->create();

    $response = $this->withHeaders($this->headers)
        ->deleteJson("/api/test-profiles/{$profile->id}");

    $response->assertOk();
    $this->assertDatabaseMissing('test_profiles', ['id' => $profile->id]);
});

it('validates required fields', function () {
    $response = $this->withHeaders($this->headers)
        ->postJson('/api/test-profiles', []);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'duration_minutes', 'categories']);
});

it('validates category must exist', function () {
    $payload = [
        'name' => 'Invalid Category Test',
        'duration_minutes' => 30,
        'categories' => [
            ['category_id' => 9999, 'question_count' => 5],
        ],
    ];

    $response = $this->withHeaders($this->headers)
        ->postJson('/api/test-profiles', $payload);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['categories.0.category_id']);
});
