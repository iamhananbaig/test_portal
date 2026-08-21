<?php

use App\Models\Category;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\Result;
use App\Models\Test;
use App\Models\TestQuestion;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->token = auth('api')->login($this->user);
    $this->headers = ['Authorization' => "Bearer {$this->token}"];
    $this->category = Category::factory()->create();
});

it('lists results for authenticated user', function () {
    $test = Test::factory()->completed()->create([
        'candidate_name' => 'Ali Khan',
        'candidate_cnic' => '35201-1234567-1',
    ]);

    Result::create([
        'test_id' => $test->id,
        'mcq_marks' => 8,
        'descriptive_marks' => 5,
        'total_obtained' => 13,
        'is_finalized' => true,
    ]);

    $response = $this->getJson('/api/results', $this->headers);

    $response->assertSuccessful()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.candidate_name', 'Ali Khan');
});

it('searches results by name', function () {
    $test1 = Test::factory()->completed()->create(['candidate_name' => 'Ali Khan']);
    $test2 = Test::factory()->completed()->create(['candidate_name' => 'Sara Khan']);

    Result::create(['test_id' => $test1->id, 'mcq_marks' => 8, 'descriptive_marks' => 5, 'total_obtained' => 13, 'is_finalized' => true]);
    Result::create(['test_id' => $test2->id, 'mcq_marks' => 6, 'descriptive_marks' => 4, 'total_obtained' => 10, 'is_finalized' => true]);

    $response = $this->getJson('/api/results?search=Ali', $this->headers);

    $response->assertSuccessful()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.candidate_name', 'Ali Khan');
});

it('searches results by cnic', function () {
    $test = Test::factory()->completed()->create(['candidate_cnic' => '35201-1234567-1']);
    Result::create(['test_id' => $test->id, 'mcq_marks' => 8, 'descriptive_marks' => 5, 'total_obtained' => 13, 'is_finalized' => true]);

    $response = $this->getJson('/api/results?search=35201', $this->headers);

    $response->assertSuccessful()
        ->assertJsonCount(1, 'data');
});

it('filters results by status', function () {
    $test1 = Test::factory()->completed()->create();
    $test2 = Test::factory()->pendingReview()->create();

    Result::create(['test_id' => $test1->id, 'mcq_marks' => 8, 'descriptive_marks' => 5, 'total_obtained' => 13, 'is_finalized' => true]);
    Result::create(['test_id' => $test2->id, 'mcq_marks' => 6, 'descriptive_marks' => 0, 'total_obtained' => 6, 'is_finalized' => false]);

    $response = $this->getJson('/api/results?status=completed', $this->headers);

    $response->assertSuccessful()
        ->assertJsonCount(1, 'data');
});

it('shows full result detail with questions', function () {
    $test = Test::factory()->completed()->create([
        'candidate_name' => 'Ali Khan',
        'total_marks' => 10,
    ]);

    $question = Question::factory()->create([
        'category_id' => $this->category->id,
        'type' => 'mcq',
        'text' => 'What is 2+2?',
        'marks' => 5,
    ]);

    $correctOption = QuestionOption::factory()->create([
        'question_id' => $question->id,
        'label' => 'A',
        'text' => '4',
        'is_correct' => true,
    ]);

    $wrongOption = QuestionOption::factory()->create([
        'question_id' => $question->id,
        'label' => 'B',
        'text' => '5',
        'is_correct' => false,
    ]);

    TestQuestion::create([
        'test_id' => $test->id,
        'question_id' => $question->id,
        'category_id' => $this->category->id,
        'display_order' => 1,
        'question_text' => $question->text,
        'question_type' => $question->type,
        'question_marks' => $question->marks,
        'question_image_path' => $question->image_path,
        'options_snapshot' => [
            ['id' => $correctOption->id, 'label' => 'A', 'text' => '4', 'image_path' => null, 'is_correct' => true],
            ['id' => $wrongOption->id, 'label' => 'B', 'text' => '5', 'image_path' => null, 'is_correct' => false],
        ],
    ]);

    $test->candidateAnswers()->create([
        'question_id' => $question->id,
        'selected_option_id' => $correctOption->id,
        'awarded_marks' => 5,
    ]);

    Result::create([
        'test_id' => $test->id,
        'mcq_marks' => 5,
        'descriptive_marks' => 0,
        'total_obtained' => 5,
        'is_finalized' => true,
    ]);

    $response = $this->getJson("/api/results/{$test->id}", $this->headers);

    $response->assertSuccessful()
        ->assertJsonPath('test.candidate_name', 'Ali Khan')
        ->assertJsonCount(1, 'questions')
        ->assertJsonCount(2, 'questions.0.options')
        ->assertJsonPath('questions.0.selected_option_id', $correctOption->id)
        ->assertJsonPath('questions.0.options.0.is_correct', true);

    $result = $response->json('result');
    expect($result['mcq_marks'])->toEqual(5.0);
    expect($result['total_obtained'])->toEqual(5.0);
});

it('includes category breakdown', function () {
    $cat2 = Category::factory()->create();
    $test = Test::factory()->completed()->create(['total_marks' => 15]);

    $q1 = Question::factory()->create(['category_id' => $this->category->id, 'marks' => 5]);
    $q2 = Question::factory()->create(['category_id' => $cat2->id, 'marks' => 10]);

    TestQuestion::create(['test_id' => $test->id, 'question_id' => $q1->id, 'category_id' => $this->category->id, 'display_order' => 1, 'question_text' => $q1->text, 'question_type' => $q1->type, 'question_marks' => $q1->marks, 'question_image_path' => $q1->image_path, 'options_snapshot' => []]);
    TestQuestion::create(['test_id' => $test->id, 'question_id' => $q2->id, 'category_id' => $cat2->id, 'display_order' => 2, 'question_text' => $q2->text, 'question_type' => $q2->type, 'question_marks' => $q2->marks, 'question_image_path' => $q2->image_path, 'options_snapshot' => []]);

    $test->candidateAnswers()->create(['question_id' => $q1->id, 'awarded_marks' => 4]);
    $test->candidateAnswers()->create(['question_id' => $q2->id, 'awarded_marks' => 8]);

    Result::create([
        'test_id' => $test->id,
        'mcq_marks' => 6,
        'descriptive_marks' => 6,
        'total_obtained' => 12,
        'is_finalized' => true,
    ]);

    $response = $this->getJson("/api/results/{$test->id}", $this->headers);

    $response->assertSuccessful()
        ->assertJsonCount(2, 'category_breakdown');

    $breakdown = $response->json('category_breakdown');
    expect($breakdown[0]['obtained_marks'])->toEqual(4.0);
    expect($breakdown[1]['obtained_marks'])->toEqual(8.0);
});

it('returns dashboard stats', function () {
    Test::factory()->ready()->create();
    Test::factory()->inProgress()->create();
    Test::factory()->pendingReview()->create();
    Test::factory()->completed()->create();
    Test::factory()->expired()->create();

    $response = $this->getJson('/api/dashboard/stats', $this->headers);

    $response->assertSuccessful()
        ->assertJsonPath('tests_by_status.ready', 1)
        ->assertJsonPath('tests_by_status.in_progress', 1)
        ->assertJsonPath('tests_by_status.pending_review', 1)
        ->assertJsonPath('tests_by_status.completed', 1)
        ->assertJsonPath('tests_by_status.expired', 1)
        ->assertJsonPath('pending_marking', 1)
        ->assertJsonPath('total_tests', 5);
});
