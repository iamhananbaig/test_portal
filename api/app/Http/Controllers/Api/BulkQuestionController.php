<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Question;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\StreamedResponse;
use Illuminate\Support\Facades\DB;
use OpenSpout\Reader\Common\Creator\ReaderEntityFactory;
use OpenSpout\Writer\Common\Creator\WriterEntityFactory;

class BulkQuestionController extends Controller
{
    public function sampleDownload(): StreamedResponse
    {
        return response()->streamDownload(function () {
            $writer = WriterEntityFactory::createXLSXWriter();
            $writer->openToPhpTemp();

            $header = WriterEntityFactory::createRow([
                WriterEntityFactory::createCell('Category'),
                WriterEntityFactory::createCell('Question'),
                WriterEntityFactory::createCell('Option A'),
                WriterEntityFactory::createCell('Option B'),
                WriterEntityFactory::createCell('Option C'),
                WriterEntityFactory::createCell('Option D'),
                WriterEntityFactory::createCell('Correct Answer'),
                WriterEntityFactory::createCell('Marks'),
            ]);
            $writer->addRow($header);

            $example = WriterEntityFactory::createRow([
                WriterEntityFactory::createCell('IQ MCQs'),
                WriterEntityFactory::createCell('What is 2+2?'),
                WriterEntityFactory::createCell('3'),
                WriterEntityFactory::createCell('4'),
                WriterEntityFactory::createCell('5'),
                WriterEntityFactory::createCell('6'),
                WriterEntityFactory::createCell('B'),
                WriterEntityFactory::createCell(1),
            ]);
            $writer->addRow($example);

            $writer->close();
            $tempUri = $writer->getTempFileUri();
            readfile($tempUri);
            unlink($tempUri);
        }, 'sample-mcq-upload.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function validate(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:10240'],
        ]);

        $file = $request->file('file');
        $reader = $this->getReader($file);
        $rows = [];

        foreach ($reader->getSheetIterator() as $sheet) {
            $rowIndex = 0;
            foreach ($sheet->getRowIterator() as $row) {
                $rowIndex++;
                if ($rowIndex === 1) {
                    continue; // skip header
                }

                $cells = $row->getCells();
                $rowData = array_map(fn ($cell) => $cell->getValue(), $cells);

                $rows[] = $this->validateRow($rowData, $rowIndex);
            }
        }
        $reader->close();

        $valid = array_filter($rows, fn ($r) => empty($r['errors']));
        $invalid = array_filter($rows, fn ($r) => ! empty($r['errors']));

        return response()->json([
            'total_rows' => count($rows),
            'valid_count' => count($valid),
            'invalid_count' => count($invalid),
            'rows' => $rows,
        ]);
    }

    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'rows' => ['required', 'array', 'min:1'],
            'rows.*.category' => ['required', 'string'],
            'rows.*.question' => ['required', 'string'],
            'rows.*.option_a' => ['required', 'string'],
            'rows.*.option_b' => ['required', 'string'],
            'rows.*.option_c' => ['required', 'string'],
            'rows.*.option_d' => ['required', 'string'],
            'rows.*.correct_answer' => ['required', 'string', 'in:A,B,C,D'],
            'rows.*.marks' => ['required', 'numeric', 'gt:0'],
        ]);

        $imported = 0;
        $failed = 0;
        $errors = [];

        DB::transaction(function () use ($request, &$imported, &$failed, &$errors) {
            foreach ($request->input('rows') as $index => $row) {
                try {
                    $category = Category::where('name', $row['category'])->first();
                    if (! $category) {
                        $failed++;
                        $errors[] = ['row' => $index + 1, 'error' => 'Category not found: '.$row['category']];

                        continue;
                    }

                    $question = Question::create([
                        'category_id' => $category->id,
                        'type' => 'mcq',
                        'text' => $row['question'],
                        'marks' => $row['marks'],
                        'is_active' => true,
                    ]);

                    $options = [
                        ['label' => 'A', 'text' => $row['option_a'], 'is_correct' => $row['correct_answer'] === 'A'],
                        ['label' => 'B', 'text' => $row['option_b'], 'is_correct' => $row['correct_answer'] === 'B'],
                        ['label' => 'C', 'text' => $row['option_c'], 'is_correct' => $row['correct_answer'] === 'C'],
                        ['label' => 'D', 'text' => $row['option_d'], 'is_correct' => $row['correct_answer'] === 'D'],
                    ];

                    foreach ($options as $option) {
                        $question->options()->create($option);
                    }

                    $imported++;
                } catch (\Exception $e) {
                    $failed++;
                    $errors[] = ['row' => $index + 1, 'error' => $e->getMessage()];
                }
            }
        });

        return response()->json([
            'imported' => $imported,
            'failed' => $failed,
            'errors' => $errors,
        ]);
    }

    private function getReader($file): ReaderEntityFactory
    {
        $extension = strtolower($file->getClientOriginalExtension());

        if ($extension === 'csv') {
            return ReaderEntityFactory::createCSVReader();
        }

        return ReaderEntityFactory::createXLSXReader();
    }

    private function validateRow(array $rowData, int $rowIndex): array
    {
        $errors = [];
        $category = $rowData[0] ?? '';
        $question = $rowData[1] ?? '';
        $optionA = $rowData[2] ?? '';
        $optionB = $rowData[3] ?? '';
        $optionC = $rowData[4] ?? '';
        $optionD = $rowData[5] ?? '';
        $correctAnswer = strtoupper(trim($rowData[6] ?? ''));
        $marks = $rowData[7] ?? '';

        if (empty($category)) {
            $errors[] = 'Category is required';
        } elseif (! Category::where('name', $category)->exists()) {
            $errors[] = 'Category not found: '.$category;
        }

        if (empty($question)) {
            $errors[] = 'Question text is required';
        }

        if (empty($optionA)) {
            $errors[] = 'Option A is required';
        }
        if (empty($optionB)) {
            $errors[] = 'Option B is required';
        }
        if (empty($optionC)) {
            $errors[] = 'Option C is required';
        }
        if (empty($optionD)) {
            $errors[] = 'Option D is required';
        }

        if (! in_array($correctAnswer, ['A', 'B', 'C', 'D'])) {
            $errors[] = 'Correct Answer must be A, B, C, or D';
        }

        if (! is_numeric($marks) || $marks <= 0) {
            $errors[] = 'Marks must be a positive number';
        }

        return [
            'row' => $rowIndex,
            'category' => $category,
            'question' => $question,
            'option_a' => $optionA,
            'option_b' => $optionB,
            'option_c' => $optionC,
            'option_d' => $optionD,
            'correct_answer' => $correctAnswer,
            'marks' => $marks,
            'errors' => $errors,
        ];
    }
}
