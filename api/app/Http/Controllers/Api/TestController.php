<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\InsufficientQuestionsException;
use App\Http\Controllers\Controller;
use App\Models\Test;
use App\Services\TestGenerationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class TestController extends Controller
{
    public function __construct(
        private TestGenerationService $testService,
    ) {}

    public function generate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'candidate_name' => ['required', 'string', 'max:255'],
            'candidate_cnic' => ['required', 'string', 'max:15'],
            'categories' => ['required', 'array', 'min:1'],
            'categories.*.category_id' => ['required', 'exists:categories,id'],
            'categories.*.count' => ['required', 'integer', 'min:1'],
            'duration_minutes' => ['required', 'integer', 'min:1'],
        ]);

        try {
            $test = $this->testService->generate(
                $validated['candidate_name'],
                $validated['candidate_cnic'],
                $validated['categories'],
                $validated['duration_minutes'],
            );

            return response()->json([
                'message' => 'Test generated successfully',
                'data' => new TestResource($test),
            ], 201);
        } catch (InsufficientQuestionsException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function index(Request $request): ResourceCollection
    {
        $query = Test::query();

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('candidate_name', 'like', "%{$search}%")
                    ->orWhere('candidate_cnic', 'like', "%{$search}%")
                    ->orWhere('test_id', 'like', "%{$search}%");
            });
        }

        $tests = $query->latest()->paginate($request->input('per_page', 15));

        return TestResource::collection($tests);
    }

    public function show(Test $test): TestResource
    {
        return new TestResource($test->load(['test_questions.question', 'test_questions.category']));
    }

    public function start(Test $test): JsonResponse
    {
        if ($test->status !== 'ready') {
            return response()->json(['message' => 'Test cannot be started.'], 422);
        }

        $now = now();
        $test->update([
            'status' => 'in_progress',
            'started_at' => $now,
            'expires_at' => $now->copy()->addMinutes($test->duration_minutes),
        ]);

        return response()->json([
            'message' => 'Test started.',
            'data' => new TestResource($test->fresh(['test_questions.question', 'test_questions.category'])),
        ]);
    }
}
