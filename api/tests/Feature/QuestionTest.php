<?php

use App\Models\Category;
use App\Models\Question;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->token = auth('api')->login($this->user);
    $this->headers = ['Authorization' => "Bearer {$this->token}"];
    $this->category = Category::factory()->create();
});

it('lists questions', function () {
    Question::factory()->count(3)->create(['category_id' => $this->category->id]);

    $response = $this->withHeaders($this->headers)
        ->getJson('/api/questions');

    $response->assertOk()
        ->assertJsonCount(3, 'data');
});

it('creates an MCQ question with options', function () {
    $response = $this->withHeaders($this->headers)
        ->postJson('/api/questions', [
            'category_id' => $this->category->id,
            'type' => 'mcq',
            'text' => 'What is 2+2?',
            'marks' => 2,
            'options' => [
                ['label' => 'A', 'text' => '3', 'is_correct' => false],
                ['label' => 'B', 'text' => '4', 'is_correct' => true],
                ['label' => 'C', 'text' => '5', 'is_correct' => false],
                ['label' => 'D', 'text' => '6', 'is_correct' => false],
            ],
        ]);

    $response->assertCreated();
    $this->assertDatabaseHas('questions', ['text' => 'What is 2+2?']);
    $this->assertDatabaseHas('question_options', ['label' => 'B', 'is_correct' => true]);
});

it('creates a descriptive question', function () {
    $response = $this->withHeaders($this->headers)
        ->postJson('/api/questions', [
            'category_id' => $this->category->id,
            'type' => 'descriptive',
            'text' => 'Explain accounting.',
            'marks' => 5,
        ]);

    $response->assertCreated();
    $this->assertDatabaseHas('questions', ['type' => 'descriptive']);
});

it('validates MCQ requires exactly 4 options', function () {
    $response = $this->withHeaders($this->headers)
        ->postJson('/api/questions', [
            'category_id' => $this->category->id,
            'type' => 'mcq',
            'text' => 'Question?',
            'marks' => 2,
            'options' => [
                ['label' => 'A', 'text' => 'Only one', 'is_correct' => true],
            ],
        ]);

    $response->assertUnprocessable();
});

it('validates marks is required', function () {
    $response = $this->withHeaders($this->headers)
        ->postJson('/api/questions', [
            'category_id' => $this->category->id,
            'type' => 'descriptive',
            'text' => 'Question without marks',
        ]);

    $response->assertUnprocessable();
});

it('toggles question status', function () {
    $question = Question::factory()->create([
        'category_id' => $this->category->id,
        'is_active' => true,
    ]);

    $response = $this->withHeaders($this->headers)
        ->putJson("/api/questions/{$question->id}/status");

    $response->assertOk();
    $this->assertDatabaseHas('questions', ['id' => $question->id, 'is_active' => false]);
});

it('filters questions by category', function () {
    $otherCategory = Category::factory()->create();
    Question::factory()->create(['category_id' => $this->category->id]);
    Question::factory()->create(['category_id' => $otherCategory->id]);

    $response = $this->withHeaders($this->headers)
        ->getJson("/api/questions?category_id={$this->category->id}");

    $response->assertOk()
        ->assertJsonCount(1, 'data');
});

it('filters questions by type', function () {
    Question::factory()->mcq()->create(['category_id' => $this->category->id]);
    Question::factory()->descriptive()->create(['category_id' => $this->category->id]);

    $response = $this->withHeaders($this->headers)
        ->getJson('/api/questions?type=mcq');

    $response->assertOk()
        ->assertJsonCount(1, 'data');
});
