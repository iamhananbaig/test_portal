<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CandidateAnswer;
use App\Models\QuestionOption;
use App\Models\Result;
use App\Models\Test;
use App\Models\TestQuestion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CandidateController extends Controller
{
    public function validateTest(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'test_id' => ['required', 'string'],
        ]);

        $test = Test::where('test_id', $validated['test_id'])->first();

        if (! $test) {
            return response()->json(['message' => 'Test not found.', 'status' => 'not_found'], 404);
        }

        if ($test->status === 'expired') {
            return response()->json(['message' => 'This test has expired.', 'status' => 'expired'], 410);
        }

        if (in_array($test->status, ['submitted', 'auto_submitted', 'completed'])) {
            return response()->json(['message' => 'This test has already been completed.', 'status' => 'completed'], 409);
        }

        return response()->json([
            'status' => $test->status,
            'candidate_name' => $test->candidate_name,
            'test_id' => $test->test_id,
        ]);
    }

    public function instructions(Test $test): JsonResponse
    {
        $test->load('test_questions.category');

        $categoryBreakdown = $test->test_questions
            ->groupBy(fn ($tq) => $tq->category->name ?? 'Unknown')
            ->map(fn ($items, $name) => [
                'category' => $name,
                'count' => $items->count(),
                'marks' => $items->sum(fn ($tq) => $tq->question->marks ?? 0),
            ])
            ->values();

        return response()->json([
            'test_id' => $test->test_id,
            'candidate_name' => $test->candidate_name,
            'duration_minutes' => $test->duration_minutes,
            'total_marks' => $test->total_marks,
            'status' => $test->status,
            'category_breakdown' => $categoryBreakdown,
        ]);
    }

    public function start(Test $test): JsonResponse
    {
        if ($test->status === 'in_progress') {
            return $this->testResponse($test);
        }

        if (! in_array($test->status, ['ready'])) {
            return response()->json(['message' => 'Test cannot be started.'], 422);
        }

        $now = now();
        $test->update([
            'status' => 'in_progress',
            'started_at' => $now,
            'expires_at' => $now->copy()->addMinutes($test->duration_minutes),
        ]);

        return $this->testResponse($test);
    }

    public function questions(Test $test): JsonResponse
    {
        if ($test->status !== 'in_progress') {
            return response()->json(['message' => 'Test is not in progress.'], 422);
        }

        if (now()->greaterThan($test->expires_at)) {
            $this->autoSubmit($test);

            return response()->json(['message' => 'Time has expired. Test auto-submitted.', 'auto_submitted' => true], 408);
        }

        $testQuestions = TestQuestion::where('test_id', $test->id)
            ->with(['question', 'question.options', 'category'])
            ->get();

        $answers = CandidateAnswer::where('test_id', $test->id)
            ->get()
            ->keyBy('question_id');

        $questions = $testQuestions->map(function ($tq) use ($answers) {
            $answer = $answers->get($tq->question_id);

            return [
                'id' => $tq->question_id,
                'text' => $tq->question->text,
                'image_path' => $tq->question->image_path,
                'type' => $tq->question->type,
                'marks' => $tq->question->marks,
                'category' => $tq->category->name ?? 'Unknown',
                'category_id' => $tq->category_id,
                'display_order' => $tq->display_order,
                'options' => $tq->question->options->map(fn ($opt) => [
                    'id' => $opt->id,
                    'label' => $opt->label,
                    'text' => $opt->text,
                    'image_path' => $opt->image_path,
                ]),
                'selected_option_id' => $answer?->selected_option_id,
                'descriptive_answer' => $answer?->descriptive_answer,
                'is_flagged' => $answer?->is_flagged ?? false,
            ];
        });

        $remainingSeconds = max(0, $test->expires_at->diffInSeconds(now(), false) * -1);

        return response()->json([
            'questions' => $questions->values(),
            'remaining_seconds' => (int) $remainingSeconds,
            'candidate_name' => $test->candidate_name,
            'test_id' => $test->test_id,
        ]);
    }

    public function answer(Request $request, Test $test): JsonResponse
    {
        if ($test->status !== 'in_progress') {
            return response()->json(['message' => 'Test is not in progress.'], 422);
        }

        if (now()->greaterThan($test->expires_at)) {
            $this->autoSubmit($test);

            return response()->json(['message' => 'Time has expired. Test auto-submitted.', 'auto_submitted' => true], 408);
        }

        $validated = $request->validate([
            'question_id' => ['required', 'exists:questions,id'],
            'selected_option_id' => ['nullable', 'exists:question_options,id'],
            'descriptive_answer' => ['nullable', 'string'],
            'time_spent_seconds' => ['nullable', 'integer', 'min:0'],
        ]);

        $questionBelongsToTest = TestQuestion::where('test_id', $test->id)
            ->where('question_id', $validated['question_id'])
            ->exists();

        if (! $questionBelongsToTest) {
            return response()->json(['message' => 'Question does not belong to this test.'], 422);
        }

        if (! empty($validated['selected_option_id'])) {
            $optionBelongsToQuestion = QuestionOption::where('id', $validated['selected_option_id'])
                ->where('question_id', $validated['question_id'])
                ->exists();

            if (! $optionBelongsToQuestion) {
                return response()->json(['message' => 'Option does not belong to this question.'], 422);
            }
        }

        CandidateAnswer::updateOrCreate(
            ['test_id' => $test->id, 'question_id' => $validated['question_id']],
            [
                'selected_option_id' => $validated['selected_option_id'] ?? null,
                'descriptive_answer' => $validated['descriptive_answer'] ?? null,
                'time_spent_seconds' => $validated['time_spent_seconds'] ?? 0,
            ]
        );

        return response()->json(['message' => 'Answer saved.', 'saved' => true]);
    }

    public function flag(Request $request, Test $test): JsonResponse
    {
        if ($test->status !== 'in_progress') {
            return response()->json(['message' => 'Test is not in progress.'], 422);
        }

        if (now()->greaterThan($test->expires_at)) {
            $this->autoSubmit($test);

            return response()->json(['message' => 'Time has expired. Test auto-submitted.', 'auto_submitted' => true], 408);
        }

        $validated = $request->validate([
            'question_id' => ['required', 'exists:questions,id'],
        ]);

        $questionBelongsToTest = TestQuestion::where('test_id', $test->id)
            ->where('question_id', $validated['question_id'])
            ->exists();

        if (! $questionBelongsToTest) {
            return response()->json(['message' => 'Question does not belong to this test.'], 422);
        }

        $answer = CandidateAnswer::where('test_id', $test->id)
            ->where('question_id', $validated['question_id'])
            ->first();

        if ($answer) {
            $flagged = ! $answer->is_flagged;
            $answer->update(['is_flagged' => $flagged]);
        } else {
            $answer = CandidateAnswer::create([
                'test_id' => $test->id,
                'question_id' => $validated['question_id'],
                'is_flagged' => true,
            ]);
            $flagged = true;
        }

        return response()->json(['is_flagged' => $flagged]);
    }

    public function submit(Test $test): JsonResponse
    {
        if (! in_array($test->status, ['in_progress'])) {
            return response()->json(['message' => 'Test is not in progress.'], 422);
        }

        DB::transaction(function () use ($test) {
            $test = Test::lockForUpdate()->find($test->id);

            if (! in_array($test->status, ['in_progress'])) {
                return;
            }

            $this->submitTest($test, 'manual');
        });

        return response()->json(['message' => 'Test submitted successfully.', 'submitted' => true]);
    }

    public function status(Test $test): JsonResponse
    {
        if ($test->status === 'in_progress' && now()->greaterThan($test->expires_at)) {
            $this->autoSubmit($test);

            return response()->json([
                'status' => 'completed',
                'auto_submitted' => true,
            ]);
        }

        return response()->json([
            'status' => $test->status,
            'submitted_at' => $test->submitted_at?->toISOString(),
            'ends_at' => $test->ends_at?->toISOString(),
        ]);
    }

    public function timeRemaining(Test $test): JsonResponse
    {
        if ($test->status !== 'in_progress') {
            return response()->json(['remaining_seconds' => 0, 'status' => $test->status]);
        }

        $remainingSeconds = max(0, $test->expires_at->diffInSeconds(now(), false) * -1);

        return response()->json([
            'remaining_seconds' => (int) $remainingSeconds,
            'status' => $test->status,
        ]);
    }

    private function testResponse(Test $test): JsonResponse
    {
        $remainingSeconds = max(0, $test->expires_at->diffInSeconds(now(), false) * -1);

        return response()->json([
            'message' => 'Test started.',
            'test_id' => $test->test_id,
            'status' => $test->status,
            'duration_minutes' => $test->duration_minutes,
            'remaining_seconds' => (int) $remainingSeconds,
            'candidate_name' => $test->candidate_name,
        ]);
    }

    private function autoSubmit(Test $test): void
    {
        $this->submitTest($test, 'auto');
    }

    private function submitTest(Test $test, string $method): void
    {
        $now = now();

        DB::transaction(function () use ($test, $now, $method) {
            $test = Test::lockForUpdate()->find($test->id);

            if ($test->status !== 'in_progress') {
                return;
            }

            $answers = CandidateAnswer::where('test_id', $test->id)
                ->whereNotNull('selected_option_id')
                ->with('question')
                ->get();

            $correctOptionIds = QuestionOption::where('is_correct', true)
                ->whereIn('question_id', $answers->pluck('question_id')->unique())
                ->pluck('id', 'question_id');

            $mcqMarks = 0;
            foreach ($answers as $answer) {
                $isCorrect = $correctOptionIds->get($answer->question_id) === $answer->selected_option_id;
                $marks = $isCorrect ? ($answer->question->marks ?? 1) : 0;
                $answer->update(['awarded_marks' => $marks]);
                $mcqMarks += $marks;
            }

            $mcqMarks = round($mcqMarks, 2);

            $hasDescriptive = TestQuestion::where('test_id', $test->id)
                ->whereHas('question', fn ($q) => $q->where('type', 'descriptive'))
                ->exists();

            $status = $hasDescriptive ? 'pending_review' : 'completed';

            $test->update([
                'status' => $status,
                'submitted_at' => $now,
                'ends_at' => $now,
                'submission_method' => $method,
            ]);

            $existingResult = Result::where('test_id', $test->id)->first();
            if ($existingResult) {
                $existingResult->update([
                    'mcq_marks' => $mcqMarks,
                    'total_obtained' => $mcqMarks + (float) $existingResult->descriptive_marks,
                ]);
            } else {
                Result::create([
                    'test_id' => $test->id,
                    'mcq_marks' => $mcqMarks,
                    'descriptive_marks' => 0,
                    'total_obtained' => $mcqMarks,
                    'is_finalized' => ! $hasDescriptive,
                ]);
            }
        });
    }
}
