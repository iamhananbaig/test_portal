<?php

use App\Models\Category;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->token = auth('api')->login($this->user);
    $this->headers = ['Authorization' => "Bearer {$this->token}"];
    $this->category = Category::factory()->create();
});

it('uploads a question image', function () {
    Storage::fake();
    $question = Question::factory()->create(['category_id' => $this->category->id]);

    $file = UploadedFile::fake()->image('question.jpg');

    $response = $this->withHeaders($this->headers)
        ->postJson("/api/questions/{$question->id}/image", [
            'image' => $file,
        ]);

    $response->assertOk()
        ->assertJsonStructure(['image_path']);
    $this->assertDatabaseHas('questions', [
        'id' => $question->id,
    ]);
    expect($question->fresh()->image_path)->not->toBeNull();
});

it('replaces an existing question image', function () {
    Storage::fake();
    $question = Question::factory()->create([
        'category_id' => $this->category->id,
        'image_path' => 'questions/old-image.jpg',
    ]);

    $file = UploadedFile::fake()->image('new-question.png');

    $response = $this->withHeaders($this->headers)
        ->postJson("/api/questions/{$question->id}/image", [
            'image' => $file,
        ]);

    $response->assertOk()
        ->assertJsonStructure(['image_path']);
    $newPath = $question->fresh()->image_path;
    expect($newPath)->not->toBe('questions/old-image.jpg');
    expect($newPath)->toContain('questions/');
});

it('removes a question image', function () {
    Storage::fake();
    $question = Question::factory()->create([
        'category_id' => $this->category->id,
        'image_path' => 'questions/existing.jpg',
    ]);

    $response = $this->withHeaders($this->headers)
        ->deleteJson("/api/questions/{$question->id}/image");

    $response->assertOk()
        ->assertJson(['message' => 'Image removed']);
    expect($question->fresh()->image_path)->toBeNull();
});

it('uploads an option image', function () {
    Storage::fake();
    $question = Question::factory()->create(['category_id' => $this->category->id]);
    $option = QuestionOption::factory()->create(['question_id' => $question->id]);

    $file = UploadedFile::fake()->image('option.jpg');

    $response = $this->withHeaders($this->headers)
        ->postJson("/api/questions/{$question->id}/options/{$option->id}/image", [
            'image' => $file,
        ]);

    $response->assertOk()
        ->assertJsonStructure(['image_path']);
    expect($option->fresh()->image_path)->not->toBeNull();
});

it('removes an option image', function () {
    Storage::fake();
    $question = Question::factory()->create(['category_id' => $this->category->id]);
    $option = QuestionOption::factory()->create([
        'question_id' => $question->id,
        'image_path' => 'questions/options/option.jpg',
    ]);

    $response = $this->withHeaders($this->headers)
        ->deleteJson("/api/questions/{$question->id}/options/{$option->id}/image");

    $response->assertOk()
        ->assertJson(['message' => 'Image removed']);
    expect($option->fresh()->image_path)->toBeNull();
});

it('validates file type for question image', function () {
    Storage::fake();
    $question = Question::factory()->create(['category_id' => $this->category->id]);

    $file = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

    $response = $this->withHeaders($this->headers)
        ->postJson("/api/questions/{$question->id}/image", [
            'image' => $file,
        ]);

    $response->assertUnprocessable();
    $this->assertDatabaseHas('questions', [
        'id' => $question->id,
        'image_path' => null,
    ]);
});

it('returns 404 for non-existent question', function () {
    Storage::fake();

    $file = UploadedFile::fake()->image('question.jpg');

    $response = $this->withHeaders($this->headers)
        ->postJson('/api/questions/999999/image', [
            'image' => $file,
        ]);

    $response->assertNotFound();
});
