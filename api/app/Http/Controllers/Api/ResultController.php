<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Test;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Support\Facades\DB;

class ResultController extends Controller
{
    public function index(Request $request): ResourceCollection
    {
        $query = Test::query()
            ->with('result')
            ->whereIn('status', ['completed', 'pending_review']);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('candidate_name', 'like', "%{$search}%")
                    ->orWhere('candidate_cnic', 'like', "%{$search}%")
                    ->orWhere('test_id', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $results = $query->latest()
            ->paginate($request->input('per_page', 15));

        return ResultResource::collection($results);
    }

    public function show(Test $test): JsonResponse
    {
        $test->load([
            'result',
            'test_questions' => fn ($q) => $q->with([
                'question' => fn ($q) => $q->with(['category', 'options']),
                'category',
            ])->orderBy('display_order'),
            'candidateAnswers' => fn ($q) => $q->with('selectedOption'),
        ]);

        $questions = $test->test_questions->map(function ($tq) use ($test) {
            $answer = $test->candidateAnswers->firstWhere('question_id', $tq->question_id);
            $question = $tq->question;

            return [
                'question_id' => $question->id,
                'text' => $question->text,
                'type' => $question->type,
                'marks' => (float) $question->marks,
                'category' => $tq->category->name,
                'display_order' => $tq->display_order,
                'options' => $question->options->map(fn ($opt) => [
                    'id' => $opt->id,
                    'label' => $opt->label,
                    'text' => $opt->text,
                    'is_correct' => $opt->is_correct,
                ]),
                'selected_option_id' => $answer?->selected_option_id,
                'descriptive_answer' => $answer?->descriptive_answer,
                'awarded_marks' => $answer?->awarded_marks !== null ? (float) $answer->awarded_marks : null,
            ];
        });

        $categoryBreakdown = $test->test_questions
            ->groupBy(fn ($tq) => $tq->category->name)
            ->map(function ($questions, $categoryName) use ($test) {
                $totalMarks = $questions->sum(fn ($tq) => (float) $tq->question->marks);
                $obtainedMarks = 0;

                foreach ($questions as $tq) {
                    $answer = $test->candidateAnswers->firstWhere('question_id', $tq->question_id);
                    if ($answer?->awarded_marks !== null) {
                        $obtainedMarks += (float) $answer->awarded_marks;
                    }
                }

                return [
                    'category' => $categoryName,
                    'total_marks' => $totalMarks,
                    'obtained_marks' => $obtainedMarks,
                ];
            })
            ->values();

        $result = $test->result;

        return response()->json([
            'test' => [
                'id' => $test->id,
                'test_id' => $test->test_id,
                'candidate_name' => $test->candidate_name,
                'candidate_cnic' => $test->candidate_cnic,
                'duration_minutes' => $test->duration_minutes,
                'total_marks' => (float) $test->total_marks,
                'status' => $test->status,
                'created_at' => $test->created_at,
                'started_at' => $test->started_at,
                'submitted_at' => $test->submitted_at,
                'submission_method' => $test->submission_method,
            ],
            'result' => $result ? [
                'mcq_marks' => (float) $result->mcq_marks,
                'descriptive_marks' => (float) $result->descriptive_marks,
                'total_obtained' => (float) $result->total_obtained,
                'is_finalized' => $result->is_finalized,
            ] : null,
            'category_breakdown' => $categoryBreakdown,
            'questions' => $questions,
        ]);
    }

    public function dashboardStats(): JsonResponse
    {
        $stats = [
            'total_questions' => DB::table('questions')->count(),
            'active_questions' => DB::table('questions')->where('is_active', true)->count(),
            'total_categories' => DB::table('categories')->count(),
            'tests_by_status' => [
                'ready' => DB::table('tests')->where('status', 'ready')->count(),
                'in_progress' => DB::table('tests')->where('status', 'in_progress')->count(),
                'pending_review' => DB::table('tests')->where('status', 'pending_review')->count(),
                'completed' => DB::table('tests')->where('status', 'completed')->count(),
                'expired' => DB::table('tests')->where('status', 'expired')->count(),
                'submitted' => DB::table('tests')->where('status', 'submitted')->count(),
            ],
            'total_tests' => DB::table('tests')->count(),
            'pending_marking' => DB::table('tests')->where('status', 'pending_review')->count(),
        ];

        return response()->json($stats);
    }
}
