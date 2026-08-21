<?php

use App\Models\CandidateAnswer;
use App\Models\Category;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\Result;
use App\Models\Test;
use App\Models\TestQuestion;

function createMcqTest(array $optionOverrides = []): array
{
    $category = Category::factory()->create(['name' => 'Logical Reasoning']);

    $questions = collect();
    $allOptions = collect();
    $correctOptionIds = [];

    foreach (range(1, 3) as $i) {
        $question = Question::factory()->create([
            'category_id' => $category->id,
            'type' => 'mcq',
            'marks' => $i,
        ]);

        $options = QuestionOption::factory()->count(4)->create([
            'question_id' => $question->id,
        ]);

        $correctIdx = $optionOverrides[$question->id] ?? 0;
        $options[$correctIdx]->update(['is_correct' => true]);
        $correctOptionIds[$question->id] = $options[$correctIdx]->id;

        $questions->push($question);
        $allOptions->push(...$options);
    }

    $test = Test::factory()->completed()->create([
        'total_marks' => 6,
    ]);

    $order = 1;
    foreach ($questions as $question) {
        $questionOptions = $question->options;
        TestQuestion::create([
            'test_id' => $test->id,
            'question_id' => $question->id,
            'category_id' => $category->id,
            'display_order' => $order++,
            'question_text' => $question->text,
            'question_type' => $question->type,
            'question_marks' => $question->marks,
            'question_image_path' => null,
            'options_snapshot' => $questionOptions->map(fn (QuestionOption $opt) => [
                'id' => $opt->id,
                'label' => $opt->label,
                'text' => $opt->text,
                'is_correct' => $opt->is_correct,
            ])->values()->all(),
        ]);
    }

    Result::create([
        'test_id' => $test->id,
        'mcq_marks' => 0,
        'descriptive_marks' => 0,
        'total_obtained' => 0,
        'is_finalized' => false,
    ]);

    return compact('test', 'questions', 'allOptions', 'correctOptionIds', 'category');
}

it('recalculates marks for a completed test with correct answers', function () {
    $data = createMcqTest();
    $test = $data['test'];
    $correctOptionIds = $data['correctOptionIds'];

    foreach ($data['questions'] as $question) {
        CandidateAnswer::create([
            'test_id' => $test->id,
            'question_id' => $question->id,
            'selected_option_id' => $correctOptionIds[$question->id],
        ]);
    }

    $this->artisan('results:recalculate-mcq')
        ->assertSuccessful();

    $answerMarks = CandidateAnswer::where('test_id', $test->id)
        ->pluck('awarded_marks')
        ->map(fn ($m) => (float) $m)
        ->all();

    expect($answerMarks)->toEqual([1.0, 2.0, 3.0]);

    $result = Result::where('test_id', $test->id)->first();
    expect((float) $result->mcq_marks)->toEqual(6.0);
    expect((float) $result->total_obtained)->toEqual(6.0);
});

it('skips tests with no MCQ answers', function () {
    $data = createMcqTest();
    $test = $data['test'];

    $this->artisan('results:recalculate-mcq')
        ->assertSuccessful();

    $result = Result::where('test_id', $test->id)->first();
    expect((float) $result->mcq_marks)->toEqual(0.0);
    expect((float) $result->total_obtained)->toEqual(0.0);
});

it('updates marks when answer correctness changes', function () {
    $data = createMcqTest();
    $test = $data['test'];
    $correctOptionIds = $data['correctOptionIds'];
    $questions = $data['questions'];

    foreach ($questions as $question) {
        CandidateAnswer::create([
            'test_id' => $test->id,
            'question_id' => $question->id,
            'selected_option_id' => $correctOptionIds[$question->id],
        ]);
    }

    $this->artisan('results:recalculate-mcq')->assertSuccessful();

    $allOptions = $data['allOptions'];
    foreach ($questions as $question) {
        $correctId = $correctOptionIds[$question->id];
        $wrongOption = $allOptions->first(
            fn (QuestionOption $opt) => $opt->question_id === $question->id && $opt->id !== $correctId
        );

        CandidateAnswer::where('test_id', $test->id)
            ->where('question_id', $question->id)
            ->update(['selected_option_id' => $wrongOption->id, 'awarded_marks' => null]);
    }

    $this->artisan('results:recalculate-mcq')->assertSuccessful();

    $answerMarks = CandidateAnswer::where('test_id', $test->id)
        ->pluck('awarded_marks')
        ->map(fn ($m) => (float) $m)
        ->all();

    expect($answerMarks)->toEqual([0.0, 0.0, 0.0]);

    $result = Result::where('test_id', $test->id)->first();
    expect((float) $result->mcq_marks)->toEqual(0.0);
    expect((float) $result->total_obtained)->toEqual(0.0);
});

it('supports --test-id flag to target specific test', function () {
    $data = createMcqTest();
    $test = $data['test'];
    $correctOptionIds = $data['correctOptionIds'];

    foreach ($data['questions'] as $question) {
        CandidateAnswer::create([
            'test_id' => $test->id,
            'question_id' => $question->id,
            'selected_option_id' => $correctOptionIds[$question->id],
        ]);
    }

    $otherData = createMcqTest();
    $otherTest = $otherData['test'];
    $otherCorrectOptionIds = $otherData['correctOptionIds'];

    foreach ($otherData['questions'] as $question) {
        CandidateAnswer::create([
            'test_id' => $otherTest->id,
            'question_id' => $question->id,
            'selected_option_id' => $otherCorrectOptionIds[$question->id],
        ]);
    }

    $this->artisan('results:recalculate-mcq', ['--test-id' => $test->test_id])
        ->assertSuccessful();

    $targetResult = Result::where('test_id', $test->id)->first();
    expect((float) $targetResult->mcq_marks)->toEqual(6.0);

    $otherResult = Result::where('test_id', $otherTest->id)->first();
    expect((float) $otherResult->mcq_marks)->toEqual(0.0);
});

it('supports --dry-run flag without writing changes', function () {
    $data = createMcqTest();
    $test = $data['test'];
    $correctOptionIds = $data['correctOptionIds'];

    foreach ($data['questions'] as $question) {
        CandidateAnswer::create([
            'test_id' => $test->id,
            'question_id' => $question->id,
            'selected_option_id' => $correctOptionIds[$question->id],
        ]);
    }

    $this->artisan('results:recalculate-mcq', ['--dry-run' => true])
        ->assertSuccessful();

    $answerMarks = CandidateAnswer::where('test_id', $test->id)
        ->pluck('awarded_marks')
        ->all();

    expect($answerMarks)->each->toBeNull();

    $result = Result::where('test_id', $test->id)->first();
    expect((float) $result->mcq_marks)->toEqual(0.0);
    expect((float) $result->total_obtained)->toEqual(0.0);
});
