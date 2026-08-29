<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTestProfileRequest;
use App\Http\Requests\UpdateTestProfileRequest;
use App\Models\TestProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Support\Facades\DB;

class TestProfileController extends Controller
{
    public function index(): ResourceCollection
    {
        $profiles = TestProfile::with('categories.category')->latest()->get();

        return TestProfileResource::collection($profiles);
    }

    public function store(StoreTestProfileRequest $request): JsonResponse
    {
        $profile = TestProfile::create($request->only('name', 'duration_minutes'));

        foreach ($request->categories as $cat) {
            $profile->categories()->create([
                'category_id' => $cat['category_id'],
                'question_count' => $cat['question_count'],
            ]);
        }

        $profile->load('categories.category');

        return response()->json([
            'message' => 'Test profile created.',
            'data' => new TestProfileResource($profile),
        ], 201);
    }

    public function show(TestProfile $testProfile): TestProfileResource
    {
        $testProfile->load('categories.category');

        return new TestProfileResource($testProfile);
    }

    public function update(UpdateTestProfileRequest $request, TestProfile $testProfile): JsonResponse
    {
        return DB::transaction(function () use ($request, $testProfile) {
            $testProfile->update($request->only('name', 'duration_minutes'));

            $testProfile->categories()->delete();

            foreach ($request->categories as $cat) {
                $testProfile->categories()->create([
                    'category_id' => $cat['category_id'],
                    'question_count' => $cat['question_count'],
                ]);
            }

            $testProfile->load('categories.category');

            return response()->json([
                'message' => 'Test profile updated.',
                'data' => new TestProfileResource($testProfile),
            ]);
        });
    }

    public function destroy(TestProfile $testProfile): JsonResponse
    {
        $testProfile->delete();

        return response()->json(['message' => 'Test profile deleted.']);
    }
}
