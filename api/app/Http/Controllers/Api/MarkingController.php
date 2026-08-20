<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Test;
use App\Services\MarkingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class MarkingController extends Controller
{
    public function __construct(
        private MarkingService $markingService,
    ) {}

    public function pending(Request $request): ResourceCollection
    {
        $tests = Test::query()
            ->where('status', 'pending_review')
            ->latest()
            ->paginate($request->input('per_page', 15));

        return TestResource::collection($tests);
    }

    public function show(Test $test): JsonResponse
    {
        if ($test->status !== 'pending_review') {
            return response()->json(['message' => 'Test is not pending review.'], 422);
        }

        $questions = $this->markingService->getDescriptiveQuestions($test);

        return response()->json([
            'test' => new TestResource($test),
            'questions' => $questions,
        ]);
    }

    public function saveMarks(Request $request, Test $test): JsonResponse
    {
        if ($test->status !== 'pending_review') {
            return response()->json(['message' => 'Test is not pending review.'], 422);
        }

        $validated = $request->validate([
            'marks' => ['required', 'array', 'min:1'],
            'marks.*.question_id' => ['required', 'exists:questions,id'],
            'marks.*.awarded_marks' => ['required', 'numeric', 'min:0'],
        ]);

        try {
            $this->markingService->saveMarks($test, $validated['marks']);

            return response()->json(['message' => 'Marks saved successfully.']);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function finalize(Test $test): JsonResponse
    {
        try {
            $result = $this->markingService->finalize($test);

            return response()->json([
                'message' => 'Test finalized successfully.',
                'result' => [
                    'mcq_marks' => (float) $result->mcq_marks,
                    'descriptive_marks' => (float) $result->descriptive_marks,
                    'total_obtained' => (float) $result->total_obtained,
                    'is_finalized' => $result->is_finalized,
                ],
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
