<?php

use App\Models\Category;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use OpenSpout\Common\Entity\Cell;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\XLSX\Writer;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->token = auth('api')->login($this->user);
    $this->headers = ['Authorization' => "Bearer {$this->token}"];
    $this->category = Category::factory()->create(['name' => 'IQ MCQs']);
});

function createSampleXlsx(array $rows): string
{
    $writer = new Writer;
    $tempPath = tempnam(sys_get_temp_dir(), 'bulk_test_');
    $writer->openToFile($tempPath);

    $header = new Row([
        Cell::fromValue('Category'),
        Cell::fromValue('Question'),
        Cell::fromValue('Option A'),
        Cell::fromValue('Option B'),
        Cell::fromValue('Option C'),
        Cell::fromValue('Option D'),
        Cell::fromValue('Correct Answer'),
        Cell::fromValue('Marks'),
    ]);
    $writer->addRow($header);

    foreach ($rows as $row) {
        $writer->addRow(new Row([
            Cell::fromValue($row['category']),
            Cell::fromValue($row['question']),
            Cell::fromValue($row['option_a']),
            Cell::fromValue($row['option_b']),
            Cell::fromValue($row['option_c']),
            Cell::fromValue($row['option_d']),
            Cell::fromValue($row['correct_answer']),
            Cell::fromValue($row['marks']),
        ]));
    }

    $writer->close();
    $content = file_get_contents($tempPath);
    unlink($tempPath);

    return $content;
}

it('validates a valid XLSX file', function () {
    $content = createSampleXlsx([
        [
            'category' => 'IQ MCQs',
            'question' => 'What is 2+2?',
            'option_a' => '3',
            'option_b' => '4',
            'option_c' => '5',
            'option_d' => '6',
            'correct_answer' => 'B',
            'marks' => 1,
        ],
    ]);

    $file = UploadedFile::fake()->createWithContent('test.xlsx', $content);

    $response = $this->withHeaders($this->headers)
        ->postJson('/api/questions/validate-upload', ['file' => $file]);

    $response->assertOk()
        ->assertJson([
            'total_rows' => 1,
            'valid_count' => 1,
            'invalid_count' => 0,
        ])
        ->assertJsonPath('rows.0.errors', []);
});

it('validates XLSX with invalid row - missing category', function () {
    $content = createSampleXlsx([
        [
            'category' => '',
            'question' => 'What is 2+2?',
            'option_a' => '3',
            'option_b' => '4',
            'option_c' => '5',
            'option_d' => '6',
            'correct_answer' => 'B',
            'marks' => 1,
        ],
    ]);

    $file = UploadedFile::fake()->createWithContent('test.xlsx', $content);

    $response = $this->withHeaders($this->headers)
        ->postJson('/api/questions/validate-upload', ['file' => $file]);

    $response->assertOk()
        ->assertJson([
            'total_rows' => 1,
            'valid_count' => 0,
            'invalid_count' => 1,
        ])
        ->assertJsonPath('rows.0.errors', fn ($errors) => in_array('Category is required', $errors));
});

it('validates XLSX with non-existent category', function () {
    $content = createSampleXlsx([
        [
            'category' => 'Non Existent',
            'question' => 'What is 2+2?',
            'option_a' => '3',
            'option_b' => '4',
            'option_c' => '5',
            'option_d' => '6',
            'correct_answer' => 'B',
            'marks' => 1,
        ],
    ]);

    $file = UploadedFile::fake()->createWithContent('test.xlsx', $content);

    $response = $this->withHeaders($this->headers)
        ->postJson('/api/questions/validate-upload', ['file' => $file]);

    $response->assertOk()
        ->assertJsonPath('rows.0.errors', fn ($errors) => str_contains($errors[0], 'Category not found'));
});

it('validates XLSX with invalid correct answer', function () {
    $content = createSampleXlsx([
        [
            'category' => 'IQ MCQs',
            'question' => 'What is 2+2?',
            'option_a' => '3',
            'option_b' => '4',
            'option_c' => '5',
            'option_d' => '6',
            'correct_answer' => 'E',
            'marks' => 1,
        ],
    ]);

    $file = UploadedFile::fake()->createWithContent('test.xlsx', $content);

    $response = $this->withHeaders($this->headers)
        ->postJson('/api/questions/validate-upload', ['file' => $file]);

    $response->assertOk()
        ->assertJsonPath('rows.0.errors', fn ($errors) => in_array('Correct Answer must be A, B, C, or D', $errors));
});

it('validates XLSX with invalid marks', function () {
    $content = createSampleXlsx([
        [
            'category' => 'IQ MCQs',
            'question' => 'What is 2+2?',
            'option_a' => '3',
            'option_b' => '4',
            'option_c' => '5',
            'option_d' => '6',
            'correct_answer' => 'B',
            'marks' => -1,
        ],
    ]);

    $file = UploadedFile::fake()->createWithContent('test.xlsx', $content);

    $response = $this->withHeaders($this->headers)
        ->postJson('/api/questions/validate-upload', ['file' => $file]);

    $response->assertOk()
        ->assertJsonPath('rows.0.errors', fn ($errors) => in_array('Marks must be a positive number', $errors));
});

it('validates XLSX with mixed valid and invalid rows', function () {
    $content = createSampleXlsx([
        [
            'category' => 'IQ MCQs',
            'question' => 'What is 2+2?',
            'option_a' => '3',
            'option_b' => '4',
            'option_c' => '5',
            'option_d' => '6',
            'correct_answer' => 'B',
            'marks' => 1,
        ],
        [
            'category' => '',
            'question' => 'Missing category?',
            'option_a' => 'A',
            'option_b' => 'B',
            'option_c' => 'C',
            'option_d' => 'D',
            'correct_answer' => 'A',
            'marks' => 1,
        ],
    ]);

    $file = UploadedFile::fake()->createWithContent('test.xlsx', $content);

    $response = $this->withHeaders($this->headers)
        ->postJson('/api/questions/validate-upload', ['file' => $file]);

    $response->assertOk()
        ->assertJson([
            'total_rows' => 2,
            'valid_count' => 1,
            'invalid_count' => 1,
        ]);
});

it('rejects upload without file', function () {
    $response = $this->withHeaders($this->headers)
        ->postJson('/api/questions/validate-upload', []);

    $response->assertUnprocessable();
});

it('rejects upload with wrong file type', function () {
    $file = UploadedFile::fake()->create('test.txt', 100, 'text/plain');

    $response = $this->withHeaders($this->headers)
        ->postJson('/api/questions/validate-upload', ['file' => $file]);

    $response->assertUnprocessable();
});

it('imports valid rows successfully', function () {
    $response = $this->withHeaders($this->headers)
        ->postJson('/api/questions/bulk-import', [
            'rows' => [
                [
                    'category' => 'IQ MCQs',
                    'question' => 'What is 2+2?',
                    'option_a' => '3',
                    'option_b' => '4',
                    'option_c' => '5',
                    'option_d' => '6',
                    'correct_answer' => 'B',
                    'marks' => 1,
                ],
            ],
        ]);

    $response->assertOk()
        ->assertJson([
            'imported' => 1,
            'failed' => 0,
        ]);

    $this->assertDatabaseHas('questions', ['text' => 'What is 2+2?']);
    $this->assertDatabaseHas('question_options', ['label' => 'B', 'is_correct' => true]);
});

it('imports multiple rows successfully', function () {
    $response = $this->withHeaders($this->headers)
        ->postJson('/api/questions/bulk-import', [
            'rows' => [
                [
                    'category' => 'IQ MCQs',
                    'question' => 'What is 2+2?',
                    'option_a' => '3',
                    'option_b' => '4',
                    'option_c' => '5',
                    'option_d' => '6',
                    'correct_answer' => 'B',
                    'marks' => 1,
                ],
                [
                    'category' => 'IQ MCQs',
                    'question' => 'What is 3+3?',
                    'option_a' => '5',
                    'option_b' => '6',
                    'option_c' => '7',
                    'option_d' => '8',
                    'correct_answer' => 'B',
                    'marks' => 2,
                ],
            ],
        ]);

    $response->assertOk()
        ->assertJson([
            'imported' => 2,
            'failed' => 0,
        ]);

    $this->assertDatabaseHas('questions', ['text' => 'What is 2+2?']);
    $this->assertDatabaseHas('questions', ['text' => 'What is 3+3?']);
});

it('fails import with non-existent category', function () {
    $response = $this->withHeaders($this->headers)
        ->postJson('/api/questions/bulk-import', [
            'rows' => [
                [
                    'category' => 'Non Existent',
                    'question' => 'What is 2+2?',
                    'option_a' => '3',
                    'option_b' => '4',
                    'option_c' => '5',
                    'option_d' => '6',
                    'correct_answer' => 'B',
                    'marks' => 1,
                ],
            ],
        ]);

    $response->assertOk()
        ->assertJson([
            'imported' => 0,
            'failed' => 1,
        ])
        ->assertJsonPath('errors.0.error', fn ($error) => str_contains($error, 'Category not found'));
});

it('validates import rows are required', function () {
    $response = $this->withHeaders($this->headers)
        ->postJson('/api/questions/bulk-import', []);

    $response->assertUnprocessable();
});

it('validates import requires at least one row', function () {
    $response = $this->withHeaders($this->headers)
        ->postJson('/api/questions/bulk-import', ['rows' => []]);

    $response->assertUnprocessable();
});

it('validates import row fields are required', function () {
    $response = $this->withHeaders($this->headers)
        ->postJson('/api/questions/bulk-import', [
            'rows' => [
                [
                    'category' => '',
                    'question' => '',
                    'option_a' => '',
                    'option_b' => '',
                    'option_c' => '',
                    'option_d' => '',
                    'correct_answer' => '',
                    'marks' => '',
                ],
            ],
        ]);

    $response->assertUnprocessable();
});

it('validates correct answer must be A, B, C, or D on import', function () {
    $response = $this->withHeaders($this->headers)
        ->postJson('/api/questions/bulk-import', [
            'rows' => [
                [
                    'category' => 'IQ MCQs',
                    'question' => 'What is 2+2?',
                    'option_a' => '3',
                    'option_b' => '4',
                    'option_c' => '5',
                    'option_d' => '6',
                    'correct_answer' => 'E',
                    'marks' => 1,
                ],
            ],
        ]);

    $response->assertUnprocessable();
});

it('validates marks must be positive on import', function () {
    $response = $this->withHeaders($this->headers)
        ->postJson('/api/questions/bulk-import', [
            'rows' => [
                [
                    'category' => 'IQ MCQs',
                    'question' => 'What is 2+2?',
                    'option_a' => '3',
                    'option_b' => '4',
                    'option_c' => '5',
                    'option_d' => '6',
                    'correct_answer' => 'B',
                    'marks' => -1,
                ],
            ],
        ]);

    $response->assertUnprocessable();
});

it('downloads sample XLSX file', function () {
    $response = $this->withHeaders($this->headers)
        ->get('/api/questions/sample-download');

    $response->assertOk()
        ->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
});
