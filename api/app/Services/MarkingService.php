<?php

namespace App\Services;

use App\Models\CandidateAnswer;
use App\Models\Result;
use App\Models\Test;
use App\Models\TestQuestion;
use Illuminate\Support\Facades\DB;

class MarkingService
{
    public function getDescriptiveQuestions(Test $test): array
    {
        $testQuestions = TestQuestion::where('test_id', $test->id)
            ->whereHas('question', fn ($q) => $q->where('type', 'descriptive'))
            ->with(['question', 'category'])
            ->get();

        $answers = CandidateAnswer::where('test_id', $test->id)
            ->whereIn('question_id', $testQuestions->pluck('question_id'))
            ->get()
            ->keyBy('question_id');

        return $testQuestions->map(function ($tq) use ($answers) {
            $answer = $answers->get($tq->question_id);

            return [
                'question_id' => $tq->question_id,
                'text' => $tq->question->text,
                'max_marks' => $tq->question->marks,
                'category' => $tq->category->name ?? 'Unknown',
                'display_order' => $tq->display_order,
                'descriptive_answer' => $answer?->descriptive_answer,
                'awarded_marks' => $answer?->awarded_marks !== null ? (float) $answer->awarded_marks : null,
            ];
        })->toArray();
    }

    public function saveMarks(Test $test, array $marks): void
    {
        DB::transaction(function () use ($test, $marks) {
            foreach ($marks as $item) {
                $questionId = $item['question_id'];
                $awardedMarks = (float) $item['awarded_marks'];

                $testQuestion = TestQuestion::where('test_id', $test->id)
                    ->where('question_id', $questionId)
                    ->whereHas('question', fn ($q) => $q->where('type', 'descriptive'))
                    ->firstOrFail();

                $maxMarks = (float) $testQuestion->question->marks;
                if ($awardedMarks < 0 || $awardedMarks > $maxMarks) {
                    throw new \InvalidArgumentException(
                        "Awarded marks must be between 0 and {$maxMarks} for question {$questionId}."
                    );
                }

                CandidateAnswer::updateOrCreate(
                    ['test_id' => $test->id, 'question_id' => $questionId],
                    ['awarded_marks' => $awardedMarks]
                );
            }

            $descriptiveMarks = $this->calculateDescriptiveMarks($test);
            $test->result->update(['descriptive_marks' => $descriptiveMarks]);
        });
    }

    public function finalize(Test $test): Result
    {
        if ($test->status !== 'pending_review') {
            throw new \InvalidArgumentException('Only tests with status pending_review can be finalized.');
        }

        $descriptiveQuestions = TestQuestion::where('test_id', $test->id)
            ->whereHas('question', fn ($q) => $q->where('type', 'descriptive'))
            ->pluck('question_id');

        if ($descriptiveQuestions->isNotEmpty()) {
            $markedCount = CandidateAnswer::where('test_id', $test->id)
                ->whereIn('question_id', $descriptiveQuestions)
                ->whereNotNull('awarded_marks')
                ->count();

            if ($markedCount < $descriptiveQuestions->count()) {
                throw new \InvalidArgumentException('All descriptive questions must be marked before finalizing.');
            }
        }

        return DB::transaction(function () use ($test) {
            $result = $test->result;
            $descriptiveMarks = $this->calculateDescriptiveMarks($test);
            $totalObtained = (float) $result->mcq_marks + $descriptiveMarks;

            $result->update([
                'descriptive_marks' => $descriptiveMarks,
                'total_obtained' => $totalObtained,
                'is_finalized' => true,
            ]);

            $test->update(['status' => 'completed']);

            return $result->fresh();
        });
    }

    private function calculateDescriptiveMarks(Test $test): float
    {
        $descriptiveQuestions = TestQuestion::where('test_id', $test->id)
            ->whereHas('question', fn ($q) => $q->where('type', 'descriptive'))
            ->pluck('question_id');

        return (float) CandidateAnswer::where('test_id', $test->id)
            ->whereIn('question_id', $descriptiveQuestions)
            ->whereNotNull('awarded_marks')
            ->sum('awarded_marks');
    }
}
