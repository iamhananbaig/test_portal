<?php

namespace App\Services;

use App\Exceptions\InsufficientQuestionsException;
use App\Models\Category;
use App\Models\Question;
use App\Models\Test;
use App\Models\TestProfile;
use App\Models\TestQuestion;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TestGenerationService
{
    public function generate(
        string $candidateName,
        string $candidateCnic,
        array $categoryConfig,
        int $durationMinutes,
        ?int $testProfileId = null,
        ?int $candidateId = null,
    ): Test {
        $this->validateCategories($categoryConfig);

        $totalMarks = 0;
        $testQuestions = [];
        $orderCounters = [];

        foreach ($categoryConfig as $config) {
            $categoryId = $config['category_id'];
            $count = $config['count'];

            $questions = Question::query()
                ->with('options')
                ->where('category_id', $categoryId)
                ->where('is_active', true)
                ->inRandomOrder()
                ->limit($count)
                ->get();

            if ($questions->count() < $count) {
                $category = Category::findOrFail($categoryId);
                throw new InsufficientQuestionsException(
                    "{$count} {$category->name} questions requested, but only {$questions->count()} active questions are available."
                );
            }

            $orderCounters[$categoryId] = 0;
            foreach ($questions as $question) {
                $orderCounters[$categoryId]++;
                $totalMarks += $question->marks;
                $testQuestions[] = [
                    'question_id' => $question->id,
                    'category_id' => $categoryId,
                    'display_order' => $orderCounters[$categoryId],
                    'question_text' => $question->text,
                    'question_type' => $question->type,
                    'question_marks' => $question->marks,
                    'question_image_path' => $question->image_path,
                    'options_snapshot' => $question->options->map(fn ($opt) => [
                        'id' => $opt->id,
                        'label' => $opt->label,
                        'text' => $opt->text,
                        'image_path' => $opt->image_path,
                        'is_correct' => $opt->is_correct,
                    ])->values()->all(),
                ];
            }
        }

        return DB::transaction(function () use ($candidateName, $candidateCnic, $candidateId, $durationMinutes, $totalMarks, $testQuestions) {
            $testId = $this->generateUniqueId();

            $test = Test::create([
                'test_id' => $testId,
                'candidate_name' => $candidateName,
                'candidate_cnic' => $candidateCnic,
                'candidate_id' => $candidateId,
                'duration_minutes' => $durationMinutes,
                'total_marks' => $totalMarks,
                'status' => 'ready',
                'created_at' => now(),
                'expires_at' => now()->addHour(),
            ]);

            foreach ($testQuestions as $tq) {
                TestQuestion::create(array_merge($tq, ['test_id' => $test->id]));
            }

            return $test->load('test_questions.question');
        });
    }

    public function generateFromProfile(
        TestProfile $profile,
        string $candidateName,
        string $candidateCnic,
        ?int $candidateId = null,
    ): Test {
        $categoryConfig = $profile->categories->map(fn ($cat) => [
            'category_id' => $cat->category_id,
            'count' => $cat->question_count,
        ])->toArray();

        return $this->generate(
            $candidateName,
            $candidateCnic,
            $categoryConfig,
            $profile->duration_minutes,
            $profile->id,
            $candidateId,
        );
    }

    private function validateCategories(array $categoryConfig): void
    {
        if (empty($categoryConfig)) {
            throw new \InvalidArgumentException('At least one category must be selected.');
        }

        foreach ($categoryConfig as $config) {
            if (empty($config['category_id']) || empty($config['count']) || $config['count'] < 1) {
                throw new \InvalidArgumentException('Each category must have a valid ID and question count.');
            }

            Category::where('id', $config['category_id'])->where('is_active', true)->firstOrFail();
        }
    }

    private function generateUniqueId(): string
    {
        $maxAttempts = 10;
        for ($attempt = 0; $attempt < $maxAttempts; $attempt++) {
            $id = strtoupper(Str::random(4).'-'.Str::random(4));
            if (! Test::where('test_id', $id)->exists()) {
                return $id;
            }
        }

        throw new \RuntimeException('Failed to generate a unique test ID after '.$maxAttempts.' attempts.');
    }
}
