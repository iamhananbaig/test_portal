<?php

namespace App\Console\Commands;

use App\Models\CandidateAnswer;
use App\Models\Test;
use App\Models\TestQuestion;
use Illuminate\Console\Command;

class RecalculateMcqMarks extends Command
{
    protected $signature = 'results:recalculate-mcq {--test-id= : Recalculate for a specific test_id} {--dry-run : Show what would change without writing}';

    protected $description = 'Backfill MCQ awarded_marks for tests submitted before per-answer marks were persisted.';

    public function handle(): int
    {
        $query = Test::query()
            ->whereIn('status', ['completed', 'pending_review'])
            ->whereHas('result');

        if ($testId = $this->option('test-id')) {
            $query->where('test_id', $testId);
        }

        $tests = $query->get();
        $dryRun = $this->option('dry-run');

        if ($tests->isEmpty()) {
            $this->info('No completed/pending_review tests found with results.');

            return self::SUCCESS;
        }

        $this->info(($dryRun ? '[DRY RUN] ' : '').'Processing '.$tests->count().' test(s)...');
        $this->newLine();

        $updated = 0;
        $skipped = 0;

        foreach ($tests as $test) {
            $mcqAnswers = CandidateAnswer::where('test_id', $test->id)
                ->whereNotNull('selected_option_id')
                ->get();

            if ($mcqAnswers->isEmpty()) {
                $this->line("  {$test->test_id}: No MCQ answers, skipping.");
                $skipped++;

                continue;
            }

            $testQuestions = TestQuestion::where('test_id', $test->id)
                ->get()
                ->keyBy('question_id');

            $correctOptionIds = [];
            foreach ($testQuestions as $tq) {
                $options = $tq->options_snapshot ?? [];
                foreach ($options as $opt) {
                    if (! empty($opt['is_correct'])) {
                        $correctOptionIds[$tq->question_id] = $opt['id'];
                    }
                }
            }

            $mcqMarks = 0;
            $answersToUpdate = 0;

            foreach ($mcqAnswers as $answer) {
                $tq = $testQuestions->get($answer->question_id);
                $isCorrect = ($correctOptionIds[$answer->question_id] ?? null) === $answer->selected_option_id;
                $marks = $isCorrect ? ($tq->question_marks ?? 1) : 0;
                $mcqMarks += $marks;

                if ($answer->awarded_marks === null || (float) $answer->awarded_marks !== (float) $marks) {
                    $answersToUpdate++;
                    if (! $dryRun) {
                        $answer->update(['awarded_marks' => $marks]);
                    }
                }
            }

            $mcqMarks = round($mcqMarks, 2);
            $result = $test->result;
            $totalObtained = round($mcqMarks + (float) $result->descriptive_marks, 2);
            $resultChanged = (float) $result->mcq_marks !== $mcqMarks
                || (float) $result->total_obtained !== $totalObtained;

            if (! $dryRun && $resultChanged) {
                $result->update([
                    'mcq_marks' => $mcqMarks,
                    'total_obtained' => $totalObtained,
                ]);
            }

            $status = $resultChanged || $answersToUpdate > 0 ? 'updated' : 'unchanged';
            $this->line(sprintf(
                '  %s: %s — %s MCQ marks, %d answers %s',
                $test->test_id,
                $status,
                $mcqMarks,
                $answersToUpdate,
                $dryRun ? 'would be updated' : 'updated'
            ));

            if ($status === 'updated') {
                $updated++;
            } else {
                $skipped++;
            }
        }

        $this->newLine();
        $this->info(($dryRun ? '[DRY RUN] ' : '')."Done. {$updated} updated, {$skipped} unchanged.");

        return self::SUCCESS;
    }
}
