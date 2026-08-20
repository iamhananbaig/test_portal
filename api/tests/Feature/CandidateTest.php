<?php

use App\Models\CandidateAnswer;
use App\Models\Category;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\Test;
use App\Models\TestQuestion;
use App\Models\User;

beforeEach(function () {
    $this->category = Category::factory()->create(['name' => 'IQ']);
    $this->questions = Question::factory()->count(3)
        ->create(['category_id' => $this->category->id, 'is_active' => true, 'marks' => 1]);

    foreach ($this->questions as $question) {
        QuestionOption::factory()->count(4)->create(['question_id' => $question->id]);
    }

    $testQuestions = [];
    foreach ($this->questions as $i => $question) {
        $testQuestions[] = [
            'question_id' => $question->id,
            'category_id' => $this->category->id,
            'display_order' => $i + 1,
        ];
    }

    $this->test = Test::create([
        'test_id' => 'TEST-0001',
        'candidate_name' => 'John Doe',
        'candidate_cnic' => '12345-1234567-1',
        'duration_minutes' => 60,
        'total_marks' => 3,
        'status' => 'ready',
        'created_at' => now(),
        'expires_at' => now()->addHour(),
    ]);

    foreach ($testQuestions as $tq) {
        TestQuestion::create(array_merge($tq, ['test_id' => $this->test->id]));
    }
});

it('validates a valid test_id', function () {
    $response = $this->postJson('/api/candidate/validate', ['test_id' => 'TEST-0001']);

    $response->assertOk()
        ->assertJsonFragment([
            'status' => 'ready',
            'candidate_name' => 'John Doe',
            'test_id' => 'TEST-0001',
        ]);
});

it('returns 404 for invalid test_id', function () {
    $response = $this->postJson('/api/candidate/validate', ['test_id' => 'INVALID']);

    $response->assertNotFound()
        ->assertJsonFragment(['status' => 'not_found']);
});

it('returns 410 for expired test', function () {
    $this->test->update(['status' => 'expired']);

    $response = $this->postJson('/api/candidate/validate', ['test_id' => 'TEST-0001']);

    $response->assertStatus(410)
        ->assertJsonFragment(['status' => 'expired']);
});

it('returns 409 for completed test', function () {
    $this->test->update(['status' => 'completed']);

    $response = $this->postJson('/api/candidate/validate', ['test_id' => 'TEST-0001']);

    $response->assertStatus(409)
        ->assertJsonFragment(['status' => 'completed']);
});

it('returns test instructions', function () {
    $response = $this->getJson('/api/candidate/'.$this->test->test_id.'/instructions');

    $response->assertOk()
        ->assertJsonFragment([
            'test_id' => 'TEST-0001',
            'candidate_name' => 'John Doe',
            'duration_minutes' => 60,
        ])
        ->assertJsonStructure([
            'category_breakdown' => [['category', 'count', 'marks']],
        ]);
});

it('starts a ready test', function () {
    $response = $this->postJson('/api/candidate/'.$this->test->test_id.'/start');

    $response->assertOk()
        ->assertJsonFragment([
            'status' => 'in_progress',
            'candidate_name' => 'John Doe',
        ]);

    $this->test->refresh();
    expect($this->test->status)->toBe('in_progress');
    expect($this->test->started_at)->not->toBeNull();
    expect($this->test->expires_at)->not->toBeNull();
});

it('allows resuming an in_progress test', function () {
    $this->test->update(['status' => 'in_progress', 'started_at' => now(), 'expires_at' => now()->addHour()]);

    $response = $this->postJson('/api/candidate/'.$this->test->test_id.'/start');

    $response->assertOk()
        ->assertJsonFragment(['status' => 'in_progress']);
});

it('rejects starting a submitted test', function () {
    $this->test->update(['status' => 'submitted']);

    $response = $this->postJson('/api/candidate/'.$this->test->test_id.'/start');

    $response->assertStatus(422)
        ->assertJsonFragment(['message' => 'Test cannot be started.']);
});

it('returns questions for in_progress test', function () {
    $this->test->update(['status' => 'in_progress', 'started_at' => now(), 'expires_at' => now()->addHour()]);

    $response = $this->getJson('/api/candidate/'.$this->test->test_id.'/questions');

    $response->assertOk()
        ->assertJsonStructure([
            'questions' => [
                '*' => ['id', 'text', 'type', 'marks', 'category', 'options', 'selected_option_id', 'is_flagged'],
            ],
            'remaining_seconds',
            'candidate_name',
            'test_id',
        ]);

    expect($response->json('questions'))->toHaveCount(3);
});

it('rejects questions for non in_progress test', function () {
    $response = $this->getJson('/api/candidate/'.$this->test->test_id.'/questions');

    $response->assertStatus(422);
});

it('saves an MCQ answer', function () {
    $this->test->update(['status' => 'in_progress', 'started_at' => now(), 'expires_at' => now()->addHour()]);
    $question = $this->questions[0];
    $option = $question->options->first();

    $response = $this->putJson('/api/candidate/'.$this->test->test_id.'/answer', [
        'question_id' => $question->id,
        'selected_option_id' => $option->id,
    ]);

    $response->assertOk()
        ->assertJsonFragment(['saved' => true]);

    $answer = CandidateAnswer::where('test_id', $this->test->id)
        ->where('question_id', $question->id)
        ->first();

    expect($answer)->not->toBeNull();
    expect($answer->selected_option_id)->toBe($option->id);
});

it('saves a descriptive answer', function () {
    $this->test->update(['status' => 'in_progress', 'started_at' => now(), 'expires_at' => now()->addHour()]);
    $descriptiveCategory = Category::factory()->create(['name' => 'Writing']);
    $descriptiveQuestion = Question::factory()->create([
        'category_id' => $descriptiveCategory->id,
        'type' => 'descriptive',
        'is_active' => true,
    ]);
    TestQuestion::create([
        'test_id' => $this->test->id,
        'question_id' => $descriptiveQuestion->id,
        'category_id' => $descriptiveCategory->id,
        'display_order' => 4,
    ]);

    $response = $this->putJson('/api/candidate/'.$this->test->test_id.'/answer', [
        'question_id' => $descriptiveQuestion->id,
        'descriptive_answer' => 'This is my answer text.',
    ]);

    $response->assertOk();

    $answer = CandidateAnswer::where('test_id', $this->test->id)
        ->where('question_id', $descriptiveQuestion->id)
        ->first();

    expect($answer->descriptive_answer)->toBe('This is my answer text.');
});

it('toggles flag on a question', function () {
    $this->test->update(['status' => 'in_progress', 'started_at' => now(), 'expires_at' => now()->addHour()]);
    $question = $this->questions[0];

    $response = $this->putJson('/api/candidate/'.$this->test->test_id.'/flag', [
        'question_id' => $question->id,
    ]);

    $response->assertOk()
        ->assertJsonFragment(['is_flagged' => true]);

    $answer = CandidateAnswer::where('test_id', $this->test->id)
        ->where('question_id', $question->id)
        ->first();

    expect($answer->is_flagged)->toBeTrue();

    // Toggle off
    $response = $this->putJson('/api/candidate/'.$this->test->test_id.'/flag', [
        'question_id' => $question->id,
    ]);

    $response->assertOk()
        ->assertJsonFragment(['is_flagged' => false]);
});

it('submits a test manually', function () {
    $this->test->update(['status' => 'in_progress', 'started_at' => now(), 'expires_at' => now()->addHour()]);

    // Answer a question correctly
    $question = $this->questions[0];
    $correctOption = $question->options->first();
    $correctOption->update(['is_correct' => true]);

    CandidateAnswer::create([
        'test_id' => $this->test->id,
        'question_id' => $question->id,
        'selected_option_id' => $correctOption->id,
    ]);

    $response = $this->postJson('/api/candidate/'.$this->test->test_id.'/submit');

    $response->assertOk()
        ->assertJsonFragment(['submitted' => true]);

    $this->test->refresh();
    expect($this->test->status)->toBe('completed');
    expect($this->test->submitted_at)->not->toBeNull();
    expect($this->test->submission_method)->toBe('manual');

    $result = $this->test->result;
    expect($result)->not->toBeNull();
    expect($result->mcq_marks)->toEqual(1.0);
    expect($result->is_finalized)->toBeTrue();
});

it('rejects submit for non in_progress test', function () {
    $response = $this->postJson('/api/candidate/'.$this->test->test_id.'/submit');

    $response->assertStatus(422);
});

it('returns test status', function () {
    $response = $this->getJson('/api/candidate/'.$this->test->test_id.'/status');

    $response->assertOk()
        ->assertJsonFragment(['status' => 'ready']);
});

it('returns remaining time', function () {
    $this->test->update(['status' => 'in_progress', 'started_at' => now(), 'expires_at' => now()->addHour()]);

    $response = $this->getJson('/api/candidate/'.$this->test->test_id.'/time');

    $response->assertOk()
        ->assertJsonStructure(['remaining_seconds', 'status']);

    expect($response->json('remaining_seconds'))->toBeGreaterThan(0);
});

it('admin can start a test', function () {
    $user = User::factory()->create();
    $this->app['auth']->guard('api')->setUser($user);

    $response = $this->actingAs($user, 'api')
        ->postJson('/api/tests/'.$this->test->id.'/start');

    $response->assertOk()
        ->assertJsonFragment(['status' => 'in_progress']);

    $this->test->refresh();
    expect($this->test->status)->toBe('in_progress');
});

it('auto-submits when time expires', function () {
    $this->test->update([
        'status' => 'in_progress',
        'started_at' => now()->subMinutes(61),
        'expires_at' => now()->subMinute(),
    ]);

    $question = $this->questions[0];
    $option = $question->options->first();
    $option->update(['is_correct' => true]);

    CandidateAnswer::create([
        'test_id' => $this->test->id,
        'question_id' => $question->id,
        'selected_option_id' => $option->id,
    ]);

    $response = $this->putJson('/api/candidate/'.$this->test->test_id.'/answer', [
        'question_id' => $this->questions[1]->id,
        'selected_option_id' => $this->questions[1]->options->first()->id,
    ]);

    $response->assertStatus(408)
        ->assertJsonFragment(['auto_submitted' => true]);

    $this->test->refresh();
    expect($this->test->status)->toBe('completed');
    expect($this->test->submission_method)->toBe('auto');
});
