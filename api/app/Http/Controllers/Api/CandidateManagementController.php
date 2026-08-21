<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCandidateRequest;
use App\Http\Requests\UpdateCandidateRequest;
use App\Models\Candidate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CandidateManagementController extends Controller
{
    public function index(Request $request): ResourceCollection
    {
        $query = Candidate::withCount('tests');

        if ($request->filled('search')) {
            $search = str_replace(['%', '_'], ['\\%', '\\_'], $request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('cnic', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $candidates = $query->latest()->paginate(min((int) $request->input('per_page', 15), 100));

        return CandidateResource::collection($candidates);
    }

    public function store(StoreCandidateRequest $request): JsonResponse
    {
        $candidate = Candidate::create($request->only('name', 'cnic', 'email', 'phone'));

        return response()->json([
            'message' => 'Candidate created.',
            'data' => new CandidateResource($candidate),
        ], 201);
    }

    public function show(Candidate $candidate): JsonResponse
    {
        $candidate->load(['tests' => function ($query) {
            $query->with('result')->latest();
        }]);

        $tests = $candidate->tests->map(fn ($test) => [
            'id' => $test->id,
            'test_id' => $test->test_id,
            'status' => $test->status,
            'total_marks' => (float) $test->total_marks,
            'obtained_marks' => $test->result ? (float) $test->result->total_obtained : null,
            'mcq_marks' => $test->result ? (float) $test->result->mcq_marks : null,
            'descriptive_marks' => $test->result ? (float) $test->result->descriptive_marks : null,
            'created_at' => $test->created_at,
        ]);

        $completedTests = $tests->filter(fn ($t) => $t['status'] === 'completed');
        $averageScore = $completedTests->isNotEmpty()
            ? round($completedTests->avg('obtained_marks'), 1)
            : null;

        return response()->json([
            'data' => [
                'id' => $candidate->id,
                'name' => $candidate->name,
                'cnic' => $candidate->cnic,
                'email' => $candidate->email,
                'phone' => $candidate->phone,
                'cv_path' => $candidate->cv_path,
                'tests' => $tests,
                'total_tests' => $candidate->tests->count(),
                'average_score' => $averageScore,
            ],
        ]);
    }

    public function update(UpdateCandidateRequest $request, Candidate $candidate): JsonResponse
    {
        $candidate->update($request->only('name', 'cnic', 'email', 'phone'));

        return response()->json([
            'message' => 'Candidate updated.',
            'data' => new CandidateResource($candidate->fresh()),
        ]);
    }

    public function destroy(Candidate $candidate): JsonResponse
    {
        if ($candidate->cv_path) {
            Storage::disk('uploads')->delete($candidate->cv_path);
        }

        $candidate->delete();

        return response()->json(['message' => 'Candidate deleted.']);
    }

    public function uploadCv(Request $request, Candidate $candidate): JsonResponse
    {
        $request->validate([
            'cv' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:5120'],
        ]);

        if ($candidate->cv_path) {
            Storage::disk('uploads')->delete($candidate->cv_path);
        }

        $file = $request->file('cv');
        $filename = Str::uuid().'.'.$file->getClientOriginalExtension();
        $path = $file->storeAs('cvs', $filename, 'uploads');
        $candidate->update(['cv_path' => $path]);

        return response()->json(['cv_path' => $path]);
    }

    public function downloadCv(Candidate $candidate): StreamedResponse
    {
        abort_unless($candidate->cv_path, 404);

        return Storage::disk('uploads')->download(
            $candidate->cv_path,
            basename($candidate->cv_path),
        );
    }
}
