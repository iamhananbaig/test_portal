<?php

use App\Models\Category;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->token = auth('api')->login($this->user);
    $this->headers = ['Authorization' => "Bearer {$this->token}"];
});

it('lists categories', function () {
    Category::factory()->count(3)->create();

    $response = $this->withHeaders($this->headers)
        ->getJson('/api/categories');

    $response->assertOk()
        ->assertJsonCount(3, 'data');
});

it('creates a category', function () {
    $response = $this->withHeaders($this->headers)
        ->postJson('/api/categories', ['name' => 'Accounting']);

    $response->assertCreated()
        ->assertJsonFragment(['name' => 'Accounting']);

    $this->assertDatabaseHas('categories', ['name' => 'Accounting']);
});

it('updates a category', function () {
    $category = Category::factory()->create(['name' => 'IQ']);

    $response = $this->withHeaders($this->headers)
        ->putJson("/api/categories/{$category->id}", ['name' => 'Logic']);

    $response->assertOk()
        ->assertJsonFragment(['name' => 'Logic']);

    $this->assertDatabaseHas('categories', ['id' => $category->id, 'name' => 'Logic']);
});

it('validates category name is required', function () {
    $response = $this->withHeaders($this->headers)
        ->postJson('/api/categories', ['name' => '']);

    $response->assertUnprocessable();
});

it('includes question count', function () {
    $category = Category::factory()->create();
    $category->questions()->createMany([
        ['type' => 'mcq', 'text' => 'Q1', 'marks' => 1],
        ['type' => 'mcq', 'text' => 'Q2', 'marks' => 1],
    ]);

    $response = $this->withHeaders($this->headers)
        ->getJson('/api/categories');

    $response->assertOk()
        ->assertJsonPath('data.0.questions_count', 2);
});
