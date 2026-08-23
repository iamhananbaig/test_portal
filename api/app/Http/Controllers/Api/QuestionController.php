<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreQuestionRequest;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Services\ImageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class QuestionController extends Controller
{
    public function __construct(
        private ImageService $imageService,
    ) {}

    public function index(Request $request): ResourceCollection
    {
        $query = Question::with('category');

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->filled('search')) {
            $search = str_replace(['%', '_'], ['\\%', '\\_'], $request->input('search'));
            $query->where('text', 'like', '%'.$search.'%');
        }

        $questions = $query->latest()->paginate(min((int) $request->input('per_page', 15), 100));

        return QuestionResource::collection($questions);
    }

    public function show(Question $question): QuestionResource
    {
        return new QuestionResource($question->load('category', 'options'));
    }

    public function store(StoreQuestionRequest $request): JsonResponse
    {
        $question = Question::create($request->validated());

        if ($request->input('type') === 'mcq' && $request->has('options')) {
            foreach ($request->input('options') as $option) {
                $question->options()->create($option);
            }
        }

        if ($request->hasFile('question_image')) {
            $path = $this->imageService->save($request->file('question_image'), 'questions');
            $question->update(['image_path' => $path]);
        }

        foreach ($request->input('options') ?? [] as $index => $optionData) {
            if ($request->hasFile("options.{$index}.image")) {
                $path = $this->imageService->save($request->file("options.{$index}.image"), 'questions/options');
                $label = $optionData['label'];
                $question->options()->where('label', $label)->update(['image_path' => $path]);
            }
        }

        return response()->json(new QuestionResource($question->load('category', 'options')), 201);
    }

    public function update(StoreQuestionRequest $request, Question $question): JsonResponse
    {
        $question->update($request->validated());

        if ($question->type === 'mcq' && $request->has('options')) {
            $question->options()->delete();
            foreach ($request->input('options') as $option) {
                $question->options()->create($option);
            }
        }

        if ($request->hasFile('question_image')) {
            if ($question->image_path) {
                $this->imageService->delete($question->image_path);
            }
            $path = $this->imageService->save($request->file('question_image'), 'questions');
            $question->update(['image_path' => $path]);
        }

        foreach ($request->input('options') ?? [] as $index => $optionData) {
            if ($request->hasFile("options.{$index}.image")) {
                $path = $this->imageService->save($request->file("options.{$index}.image"), 'questions/options');
                $label = $optionData['label'];
                $question->options()->where('label', $label)->update(['image_path' => $path]);
            }
        }

        return response()->json(new QuestionResource($question->load('category', 'options')));
    }

    public function toggleStatus(Question $question): JsonResponse
    {
        $question->update(['is_active' => ! $question->is_active]);

        return response()->json(new QuestionResource($question));
    }

    public function uploadImage(Request $request, Question $question): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png', 'max:5120'],
        ]);

        $path = $this->imageService->save($request->file('image'), 'questions');
        $question->update(['image_path' => $path]);

        return response()->json(['image_path' => $path]);
    }

    public function destroyImage(Question $question): JsonResponse
    {
        if ($question->image_path) {
            $this->imageService->delete($question->image_path);
            $question->update(['image_path' => null]);
        }

        return response()->json(['message' => 'Image removed']);
    }

    public function uploadOptionImage(Request $request, Question $question, QuestionOption $option): JsonResponse
    {
        if ($option->question_id !== $question->id) {
            return response()->json(['message' => 'Option does not belong to this question.'], 422);
        }

        $request->validate([
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png', 'max:5120'],
        ]);

        $path = $this->imageService->save($request->file('image'), 'questions/options');
        $option->update(['image_path' => $path]);

        return response()->json(['image_path' => $path]);
    }

    public function destroyOptionImage(Question $question, QuestionOption $option): JsonResponse
    {
        if ($option->question_id !== $question->id) {
            return response()->json(['message' => 'Option does not belong to this question.'], 422);
        }

        if ($option->image_path) {
            $this->imageService->delete($option->image_path);
            $option->update(['image_path' => null]);
        }

        return response()->json(['message' => 'Image removed']);
    }
}
