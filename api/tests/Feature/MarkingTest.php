<?php

use App\Models\CandidateAnswer;
use App\Models\Category;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\Result;
use App\Models\Test;
use App\Models\TestQuestion;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->category = Category::factory()->create(['name' => 'IQ']);

    // Create MCQ questions
    $this->mcqQuestions = Question::factory()->count(2)
        ->create(['category_id' => $this->category->id, 'type' => 'mcq', 'is_active' => true, 'marks' => 1]);

    foreach ($this->mcqQuestions as $question) {
        QuestionOption::factory()->count(4)->create(['question_id' => $question->id]);
    }

    // Create descriptive questions
    $this->descriptiveQuestions = Question::factory()->count(2)
        ->create(['category_id' => $this->category->id, 'type' => 'descriptive', 'is_active' => true, 'marks' => 5]);

    // Create test with all questions
    $this->test = Test::factory()->pendingReview()->create([
        'total_marks' => 12, // 2 MCQ * 1 + 2 descriptive * 5
    ]);

    $order = 1;
    foreach (array_merge($this->mcqQuestions->toArray(), $this->descriptiveQuestions->toArray()) as $question) {
        TestQuestion::create([
            'test_id' => $this->test->id,
            'question_id' => $question['id'],
            'category_id' => $this->category->id,
            'display_order' => $order++,
        ]);
    }

    // Create result with MCQ marks already calculated
    Result::create([
        'test_id' => $this->test->id,
        'mcq_marks' => 1,
        'descriptive_marks' => 0,
        'total_obtained' => 1,
        'is_finalized' => false,
    ]);

    // Add candidate answers for descriptive questions
    foreach ($this->descriptiveQuestions as $question) {
        CandidateAnswer::create([
            'test_id' => $this->test->id,
            'question_id' => $question->id,
            'descriptive_answer' => 'Sample answer for marking.',
        ]);
    }
});

it('lists pending tests for marking', function () {
    $response = $this->actingAs($this->user, 'api')
        ->getJson('/api/marking/pending');

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'test_id', 'candidate_name', 'status'],
            ],
        ]);

    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data.0.status'))->toBe('pending_review');
});

it('returns descriptive questions for a pending test', function () {
    $response = $this->actingAs($this->user, 'api')
        ->getJson('/api/marking/'.$this->test->id);

    $response->assertOk()
        ->assertJsonStructure([
            'test' => ['id', 'test_id', 'candidate_name', 'status'],
            'questions' => [
                '*' => ['question_id', 'text', 'max_marks', 'category', 'display_order', 'descriptive_answer', 'awarded_marks'],
            ],
        ]);

    expect($response->json('questions'))->toHaveCount(2);
    expect($response->json('questions.0.descriptive_answer'))->toBe('Sample answer for marking.');
    expect($response->json('questions.0.awarded_marks'))->toBeNull();
});

it('rejects showing questions for non-pending test', function () {
    $this->test->update(['status' => 'completed']);

    $response = $this->actingAs($this->user, 'api')
        ->getJson('/api/marking/'.$this->test->id);

    $response->assertStatus(422)
        ->assertJsonFragment(['message' => 'Test is not pending review.']);
});

it('saves marks for descriptive questions', function () {
    $response = $this->actingAs($this->user, 'api')
        ->putJson('/api/marking/'.$this->test->id, [
            'marks' => [
                ['question_id' => $this->descriptiveQuestions[0]->id, 'awarded_marks' => 4],
                ['question_id' => $this->descriptiveQuestions[1]->id, 'awarded_marks' => 3],
            ],
        ]);

    $response->assertOk()
        ->assertJsonFragment(['message' => 'Marks saved successfully.']);

    $this->test->refresh();
    expect($this->test->result->descriptive_marks)->toEqual('7.00');

    $answer1 = CandidateAnswer::where('test_id', $this->test->id)
        ->where('question_id', $this->descriptiveQuestions[0]->id)
        ->first();
    expect($answer1->awarded_marks)->toEqual('4.00');
});

it('validates marks do not exceed max marks', function () {
    $response = $this->actingAs($this->user, 'api')
        ->putJson('/api/marking/'.$this->test->id, [
            'marks' => [
                ['question_id' => $this->descriptiveQuestions[0]->id, 'awarded_marks' => 99],
            ],
        ]);

    $response->assertStatus(422);
});

it('validates marks cannot be negative', function () {
    $response = $this->actingAs($this->user, 'api')
        ->putJson('/api/marking/'.$this->test->id, [
            'marks' => [
                ['question_id' => $this->descriptiveQuestions[0]->id, 'awarded_marks' => -1],
            ],
        ]);

    $response->assertStatus(422);
});

it('rejects saving marks for non-pending test', function () {
    $this->test->update(['status' => 'completed']);

    $response = $this->actingAs($this->user, 'api')
        ->putJson('/api/marking/'.$this->test->id, [
            'marks' => [
                ['question_id' => $this->descriptiveQuestions[0]->id, 'awarded_marks' => 3],
            ],
        ]);

    $response->assertStatus(422)
        ->assertJsonFragment(['message' => 'Test is not pending review.']);
});

it('finalizes a marked test', function () {
    // Save marks first
    $this->actingAs($this->user, 'api')
        ->putJson('/api/marking/'.$this->test->id, [
            'marks' => [
                ['question_id' => $this->descriptiveQuestions[0]->id, 'awarded_marks' => 5],
                ['question_id' => $this->descriptiveQuestions[1]->id, 'awarded_marks' => 4],
            ],
        ]);

    $response = $this->actingAs($this->user, 'api')
        ->postJson('/api/marking/'.$this->test->id.'/finalize');

    $response->assertOk()
        ->assertJsonFragment(['message' => 'Test finalized successfully.'])
        ->assertJsonStructure([
            'result' => ['mcq_marks', 'descriptive_marks', 'total_obtained', 'is_finalized'],
        ]);

    expect($response->json('result.total_obtained'))->toEqual(10.0); // 1 mcq + 9 descriptive
    expect($response->json('result.is_finalized'))->toBeTrue();

    $this->test->refresh();
    expect($this->test->status)->toBe('completed');
});

it('rejects finalizing when not all descriptive questions are marked', function () {
    // Save marks for only one of two descriptive questions
    $this->actingAs($this->user, 'api')
        ->putJson('/api/marking/'.$this->test->id, [
            'marks' => [
                ['question_id' => $this->descriptiveQuestions[0]->id, 'awarded_marks' => 5],
            ],
        ]);

    $response = $this->actingAs($this->user, 'api')
        ->postJson('/api/marking/'.$this->test->id.'/finalize');

    $response->assertStatus(422)
        ->assertJsonFragment(['message' => 'All descriptive questions must be marked before finalizing.']);
});

it('rejects finalizing a non-pending test', function () {
    $this->test->update(['status' => 'completed']);

    $response = $this->actingAs($this->user, 'api')
        ->postJson('/api/marking/'.$this->test->id.'/finalize');

    $response->assertStatus(422)
        ->assertJsonFragment(['message' => 'Only tests with status pending_review can be finalized.']);
});

it('requires authentication for marking endpoints', function () {
    $this->getJson('/api/marking/pending')->assertStatus(401);
    $this->getJson('/api/marking/'.$this->test->id)->assertStatus(401);
    $this->putJson('/api/marking/'.$this->test->id, [])->assertStatus(401);
    $this->postJson('/api/marking/'.$this->test->id.'/finalize')->assertStatus(401);
});
