<?php

use App\Models\Category;
use App\Models\Question;
use App\Models\Test;
use App\Models\User;
use Carbon\Carbon;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->token = auth('api')->login($this->user);
    $this->headers = ['Authorization' => "Bearer {$this->token}"];
});

it('generates a test successfully', function () {
    $category = Category::factory()->create(['name' => 'IQ']);
    Question::factory()->count(5)->mcq()->create(['category_id' => $category->id, 'is_active' => true]);

    $response = $this->withHeaders($this->headers)
        ->postJson('/api/tests/generate', [
            'candidate_name' => 'Ahmed Ali',
            'candidate_cnic' => '35202-1234567-1',
            'categories' => [
                ['category_id' => $category->id, 'count' => 3],
            ],
            'duration_minutes' => 60,
        ]);

    $response->assertCreated()
        ->assertJsonStructure([
            'message',
            'data' => ['id', 'test_id', 'candidate_name', 'status', 'total_marks'],
        ]);

    $this->assertDatabaseHas('tests', [
        'candidate_name' => 'Ahmed Ali',
        'status' => 'ready',
    ]);
});

it('returns unique 8-char test_id with dash', function () {
    $category = Category::factory()->create();
    Question::factory()->count(3)->create(['category_id' => $category->id, 'is_active' => true]);

    $response = $this->withHeaders($this->headers)
        ->postJson('/api/tests/generate', [
            'candidate_name' => 'Test',
            'candidate_cnic' => '12345-1234567-1',
            'categories' => [['category_id' => $category->id, 'count' => 2]],
            'duration_minutes' => 30,
        ]);

    $testId = $response->json('data.test_id');
    expect($testId)->toMatch('/^[A-Z0-9]{4}-[A-Z0-9]{4}$/');
});

it('fails when insufficient questions available', function () {
    $category = Category::factory()->create(['name' => 'IQ']);
    Question::factory()->count(2)->create(['category_id' => $category->id, 'is_active' => true]);

    $response = $this->withHeaders($this->headers)
        ->postJson('/api/tests/generate', [
            'candidate_name' => 'Test',
            'candidate_cnic' => '12345-1234567-1',
            'categories' => [['category_id' => $category->id, 'count' => 5]],
            'duration_minutes' => 60,
        ]);

    $response->assertUnprocessable()
        ->assertJsonFragment(['message' => '5 IQ questions requested, but only 2 active questions are available.']);
});

it('calculates total marks correctly', function () {
    $category = Category::factory()->create();
    Question::factory()->create(['category_id' => $category->id, 'is_active' => true, 'marks' => 3]);
    Question::factory()->create(['category_id' => $category->id, 'is_active' => true, 'marks' => 5]);

    $response = $this->withHeaders($this->headers)
        ->postJson('/api/tests/generate', [
            'candidate_name' => 'Test',
            'candidate_cnic' => '12345-1234567-1',
            'categories' => [['category_id' => $category->id, 'count' => 2]],
            'duration_minutes' => 60,
        ]);

    $response->assertCreated();
    expect($response->json('data.total_marks'))->toEqual(8.0);
});

it('sets expires_at to one hour after creation', function () {
    $category = Category::factory()->create();
    Question::factory()->count(2)->create(['category_id' => $category->id, 'is_active' => true]);

    $response = $this->withHeaders($this->headers)
        ->postJson('/api/tests/generate', [
            'candidate_name' => 'Test',
            'candidate_cnic' => '12345-1234567-1',
            'categories' => [['category_id' => $category->id, 'count' => 2]],
            'duration_minutes' => 60,
        ]);

    $expiresAt = Carbon::parse($response->json('data.expires_at'));
    $createdAt = Carbon::parse($response->json('data.created_at'));
    $diffInSeconds = $createdAt->diffInSeconds($expiresAt);
    expect($diffInSeconds)->toBeGreaterThanOrEqual(3599);
});

it('lists tests', function () {
    $category = Category::factory()->create();
    Question::factory()->count(2)->create(['category_id' => $category->id, 'is_active' => true]);

    $this->withHeaders($this->headers)
        ->postJson('/api/tests/generate', [
            'candidate_name' => 'Test',
            'candidate_cnic' => '12345-1234567-1',
            'categories' => [['category_id' => $category->id, 'count' => 2]],
            'duration_minutes' => 60,
        ]);

    $response = $this->withHeaders($this->headers)
        ->getJson('/api/tests');

    $response->assertOk()
        ->assertJsonCount(1, 'data');
});

it('shows test detail with questions', function () {
    $category = Category::factory()->create();
    Question::factory()->count(3)->create(['category_id' => $category->id, 'is_active' => true]);

    $createResponse = $this->withHeaders($this->headers)
        ->postJson('/api/tests/generate', [
            'candidate_name' => 'Test',
            'candidate_cnic' => '12345-1234567-1',
            'categories' => [['category_id' => $category->id, 'count' => 2]],
            'duration_minutes' => 60,
        ]);

    $testId = $createResponse->json('data.id');

    $response = $this->withHeaders($this->headers)
        ->getJson("/api/tests/{$testId}");

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                'id',
                'test_id',
                'questions' => [
                    '*' => ['question_id', 'category_id', 'display_order'],
                ],
            ],
        ]);
});

it('validates required fields', function () {
    $response = $this->withHeaders($this->headers)
        ->postJson('/api/tests/generate', []);

    $response->assertUnprocessable();
});

it('validates category must exist', function () {
    $response = $this->withHeaders($this->headers)
        ->postJson('/api/tests/generate', [
            'candidate_name' => 'Test',
            'candidate_cnic' => '12345-1234567-1',
            'categories' => [['category_id' => 9999, 'count' => 5]],
            'duration_minutes' => 60,
        ]);

    $response->assertUnprocessable();
});

it('marks expired tests via scheduled command', function () {
    $category = Category::factory()->create();
    Question::factory()->count(2)->create(['category_id' => $category->id, 'is_active' => true]);

    $this->withHeaders($this->headers)
        ->postJson('/api/tests/generate', [
            'candidate_name' => 'Test',
            'candidate_cnic' => '12345-1234567-1',
            'categories' => [['category_id' => $category->id, 'count' => 2]],
            'duration_minutes' => 60,
        ]);

    $test = Test::first();
    $test->update(['expires_at' => now()->subHour()]);

    $this->artisan('app:mark-expired-tests');

    $this->assertDatabaseHas('tests', ['id' => $test->id, 'status' => 'expired']);
});
