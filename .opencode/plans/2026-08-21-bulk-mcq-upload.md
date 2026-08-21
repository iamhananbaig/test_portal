# Bulk MCQ Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a bulk MCQ upload module that lets admins upload Excel/CSV files to create multiple questions at once, with a sample file download.

**Architecture:** New `BulkQuestionController` on the backend handles file parsing (via `openspout`), validation, and batch insert. Frontend gets a new `BulkUpload.tsx` page with drag-and-drop upload, preview table, and import flow. Sample file generation uses the same `openspout` library.

**Tech Stack:** Laravel 13, PHP 8.4, openspout (Excel/CSV parsing), React 19, TanStack Query, Tailwind v4, lucide-react

## Global Constraints

- PHP 8 attributes on models: `#[Fillable([...])]`, not traditional `$fillable` arrays
- Pest PHP for testing, not PHPUnit directly
- Pint for PHP formatting — always run `vendor/bin/pint --dirty --format agent` after PHP changes
- oxlint for frontend linting (not ESLint)
- No unused imports (oxlint `no-unused-imports` rule)
- Tailwind v4 with `@theme` directive, custom tokens in `index.css`
- lucide-react for icons
- `--no-interaction` on all `php artisan make:` commands
- Form Requests for validation, API Resources for JSON responses

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `api/app/Http/Controllers/Api/BulkQuestionController.php` | **Create** | Upload, validate, import, sample download |
| `api/routes/api.php` | **Modify** | Add 3 bulk upload routes |
| `frontend/src/pages/admin/BulkUpload.tsx` | **Create** | Upload UI with preview and import |
| `frontend/src/App.tsx` | **Modify** | Add route for bulk upload page |
| `frontend/src/layouts/AdminLayout.tsx` | **Modify** | Add nav link for bulk upload |

---

### Task 1: Install openspout and Create BulkQuestionController

**Files:**
- Create: `api/app/Http/Controllers/Api/BulkQuestionController.php`

**Interfaces:**
- Produces: `BulkQuestionController` with methods `sampleDownload`, `validate`, `import`

- [ ] **Step 1: Install openspout package**

Run: `cd api && composer require openspout/openspout`
Expected: Package installed successfully

- [ ] **Step 2: Create BulkQuestionController**

Create `api/app/Http/Controllers/Api/BulkQuestionController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Question;
use App\Models\QuestionOption;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\StreamedResponse;
use Illuminate\Support\Facades\DB;
use OpenSpout\Common\Entity\Row;
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
                $rowData = array_map(fn($cell) => $cell->getValue(), $cells);

                $rows[] = $this->validateRow($rowData, $rowIndex);
            }
        }
        $reader->close();

        $valid = array_filter($rows, fn($r) => empty($r['errors']));
        $invalid = array_filter($rows, fn($r) => !empty($r['errors']));

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

    private function getReader($file): \OpenSpout\Reader\Common\Creator\ReaderEntityFactory
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
```

- [ ] **Step 3: Verify PHP syntax**

Run: `cd api && php -l app/Http/Controllers/Api/BulkQuestionController.php`
Expected: No syntax errors

- [ ] **Step 4: Run Pint**

Run: `cd api && vendor/bin/pint --dirty --format agent`
Expected: Formatted successfully

- [ ] **Step 5: Commit**

```bash
cd api && git add app/Http/Controllers/Api/BulkQuestionController.php composer.json composer.lock && git commit -m "feat: add BulkQuestionController with sample download, validate, and import"
```

---

### Task 2: Add API Routes

**Files:**
- Modify: `api/routes/api.php:8-11` (add import) and `api/routes/api.php:25-30` (add routes)

**Interfaces:**
- Consumes: `BulkQuestionController` from Task 1

- [ ] **Step 1: Add BulkQuestionController import**

In `api/routes/api.php`, add after line 8 (`use App\Http\Controllers\Api\QuestionController;`):

```php
use App\Http\Controllers\Api\BulkQuestionController;
```

- [ ] **Step 2: Add bulk upload routes**

In `api/routes/api.php`, add after line 30 (after the question image routes), inside the `auth:api` middleware group:

```php
Route::get('/questions/sample-download', [BulkQuestionController::class, 'sampleDownload']);
Route::post('/questions/validate-upload', [BulkQuestionController::class, 'validate']);
Route::post('/questions/bulk-import', [BulkQuestionController::class, 'import']);
```

- [ ] **Step 3: Verify routes are registered**

Run: `cd api && php artisan route:list --path=questions`
Expected: Shows the 3 new routes alongside existing question routes

- [ ] **Step 4: Run Pint**

Run: `cd api && vendor/bin/pint --dirty --format agent`
Expected: Formatted successfully

- [ ] **Step 5: Commit**

```bash
cd api && git add routes/api.php && git commit -m "feat: add bulk upload API routes"
```

---

### Task 3: Create BulkUpload Frontend Page

**Files:**
- Create: `frontend/src/pages/admin/BulkUpload.tsx`

**Interfaces:**
- Consumes: API endpoints from Task 2 (`/questions/sample-download`, `/questions/validate-upload`, `/questions/bulk-import`)
- Produces: `BulkUpload` page component

- [ ] **Step 1: Create the BulkUpload page**

Create `frontend/src/pages/admin/BulkUpload.tsx`:

```tsx
import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { Upload, Download, CheckCircle, AlertCircle, FileSpreadsheet, X } from 'lucide-react'
import api from '@/services/api'
import Button from '@/components/ui/Button'
import Card, { CardContent } from '@/components/ui/Card'
import PageHeader from '@/components/ui/PageHeader'

interface ValidatedRow {
  row: number
  category: string
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  marks: string | number
  errors: string[]
}

interface ValidateResponse {
  total_rows: number
  valid_count: number
  invalid_count: number
  rows: ValidatedRow[]
}

interface ImportResponse {
  imported: number
  failed: number
  errors: { row: number; error: string }[]
}

export default function BulkUpload() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ValidateResponse | null>(null)
  const [importResult, setImportResult] = useState<ImportResponse | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const validateMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const response = await api.post('/questions/validate-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data as ValidateResponse
    },
    onSuccess: (data) => {
      setPreview(data)
    },
  })

  const importMutation = useMutation({
    mutationFn: async (rows: ValidatedRow[]) => {
      const validRows = rows.filter((r) => r.errors.length === 0)
      const response = await api.post('/questions/bulk-import', { rows: validRows })
      return response.data as ImportResponse
    },
    onSuccess: (data) => {
      setImportResult(data)
    },
  })

  const handleFile = useCallback((selectedFile: File) => {
    setFile(selectedFile)
    setPreview(null)
    setImportResult(null)
    validateMutation.mutate(selectedFile)
  }, [validateMutation])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFile(droppedFile)
    }
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFile(selectedFile)
    }
  }, [handleFile])

  const downloadSample = async () => {
    const response = await api.get('/questions/sample-download', { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'sample-mcq-upload.xlsx')
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const validRows = preview?.rows.filter((r) => r.errors.length === 0) ?? []

  return (
    <div>
      <PageHeader
        title="Bulk Upload Questions"
        action={
          <Button variant="secondary" onClick={downloadSample} icon={<Download className="h-4 w-4" />}>
            Download Sample
          </Button>
        }
      />

      <Card className="mt-6">
        <CardContent>
          {!file && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
                dragOver
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-slate-300 dark:border-slate-600 hover:border-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <FileSpreadsheet className="mb-3 h-10 w-10 text-slate-400" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Drop your Excel or CSV file here, or click to browse
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Supports .xlsx, .xls, .csv (max 10MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          )}

          {file && !preview && !importResult && (
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-primary-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              {validateMutation.isPending && (
                <p className="text-sm text-slate-500">Validating...</p>
              )}
              <Button variant="ghost" size="sm" onClick={reset}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {validateMutation.isError && (
            <div className="mt-4 rounded-lg bg-rose-50 dark:bg-rose-900/20 p-4 text-sm text-rose-700 dark:text-rose-400">
              Failed to validate file. Please check the format and try again.
            </div>
          )}

          {preview && !importResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Total rows: <strong>{preview.total_rows}</strong>
                </span>
                <span className="text-emerald-600">
                  Valid: <strong>{preview.valid_count}</strong>
                </span>
                {preview.invalid_count > 0 && (
                  <span className="text-rose-600">
                    Invalid: <strong>{preview.invalid_count}</strong>
                  </span>
                )}
              </div>

              <div className="max-h-96 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">#</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Category</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Question</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">A</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">B</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">C</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">D</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Answer</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Marks</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {preview.rows.map((row) => (
                      <tr
                        key={row.row}
                        className={row.errors.length > 0 ? 'bg-rose-50/50 dark:bg-rose-900/10' : ''}
                      >
                        <td className="px-3 py-2 text-slate-500">{row.row}</td>
                        <td className="px-3 py-2 text-slate-900 dark:text-slate-100">{row.category}</td>
                        <td className="max-w-[200px] truncate px-3 py-2 text-slate-900 dark:text-slate-100">{row.question}</td>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{row.option_a}</td>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{row.option_b}</td>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{row.option_c}</td>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{row.option_d}</td>
                        <td className="px-3 py-2 font-medium text-primary-600">{row.correct_answer}</td>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{row.marks}</td>
                        <td className="px-3 py-2">
                          {row.errors.length > 0 ? (
                            <span className="inline-flex items-center gap-1 text-rose-600">
                              <AlertCircle className="h-3.5 w-3.5" />
                              {row.errors[0]}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-600">
                              <CheckCircle className="h-3.5 w-3.5" />
                              Valid
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={reset}>Cancel</Button>
                <Button
                  onClick={() => importMutation.mutate(validRows)}
                  loading={importMutation.isPending}
                  disabled={validRows.length === 0}
                >
                  Import {validRows.length} Questions
                </Button>
              </div>
            </div>
          )}

          {importResult && (
            <div className="space-y-4">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-6 text-center">
                <CheckCircle className="mx-auto h-10 w-10 text-emerald-600 mb-2" />
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {importResult.imported} questions imported successfully
                </p>
                {importResult.failed > 0 && (
                  <p className="mt-1 text-sm text-rose-600">
                    {importResult.failed} questions failed
                  </p>
                )}
              </div>

              {importResult.errors.length > 0 && (
                <div className="rounded-lg bg-rose-50 dark:bg-rose-900/20 p-4">
                  <p className="mb-2 text-sm font-medium text-rose-700 dark:text-rose-400">Errors:</p>
                  <ul className="space-y-1 text-sm text-rose-600">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>Row {err.row}: {err.error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={reset}>Upload Another</Button>
                <Button onClick={() => navigate('/admin/questions')}>Go to Question Bank</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Verify the component compiles**

Run: `cd frontend && npm run build`
Expected: BUILD SUCCESSFUL

- [ ] **Step 3: Commit**

```bash
cd frontend && git add src/pages/admin/BulkUpload.tsx && git commit -m "feat: add BulkUpload page with drag-and-drop, preview, and import"
```

---

### Task 4: Add Route and Nav Link

**Files:**
- Modify: `frontend/src/App.tsx:16-34` (add lazy import) and `frontend/src/App.tsx:80-98` (add route)
- Modify: `frontend/src/layouts/AdminLayout.tsx:4-17` (add icon) and `frontend/src/layouts/AdminLayout.tsx:22-31` (add nav item)

**Interfaces:**
- Consumes: `BulkUpload` component from Task 3

- [ ] **Step 1: Add lazy import for BulkUpload**

In `frontend/src/App.tsx`, add after line 16 (`const QuestionForm = lazy(...)`) :

```tsx
const BulkUpload = lazy(() => import('@/pages/admin/BulkUpload'))
```

- [ ] **Step 2: Add route for BulkUpload**

In `frontend/src/App.tsx`, add after line 84 (`<Route path="questions/:id/edit" element={<QuestionForm />} />`):

```tsx
<Route path="questions/bulk-upload" element={<BulkUpload />} />
```

- [ ] **Step 3: Add Upload icon import in AdminLayout**

In `frontend/src/layouts/AdminLayout.tsx`, add `Upload` to the lucide-react import (line 4-17). Add it after `HelpCircle`:

```tsx
import {
  LayoutDashboard,
  FolderOpen,
  HelpCircle,
  Upload,
  FileText,
  ClipboardList,
  Users,
  PenLine,
  BarChart3,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react'
```

- [ ] **Step 4: Add nav item for Bulk Upload**

In `frontend/src/layouts/AdminLayout.tsx`, add after line 25 (`{ to: '/admin/questions', label: 'Question Bank', icon: HelpCircle },`):

```tsx
{ to: '/admin/questions/bulk-upload', label: 'Bulk Upload', icon: Upload },
```

- [ ] **Step 5: Verify build**

Run: `cd frontend && npm run lint && npm run build`
Expected: Both pass

- [ ] **Step 6: Commit**

```bash
cd frontend && git add src/App.tsx src/layouts/AdminLayout.tsx && git commit -m "feat: add route and nav link for Bulk Upload page"
```

---

### Task 5: Write Pest Test for Bulk Upload

**Files:**
- Create: `api/tests/Feature/BulkQuestionUploadTest.php`

**Interfaces:**
- Consumes: API routes from Task 2

- [ ] **Step 1: Create the test file**

Create `api/tests/Feature/BulkQuestionUploadTest.php`:

```php
<?php

use App\Models\Category;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user, 'api');
    $this->category = Category::factory()->create(['name' => 'Test Category']);
});

it('can download sample file', function () {
    $response = $this->getJson('/api/questions/sample-download');

    $response->assertStatus(200);
    $response->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
});

it('can validate a valid upload file', function () {
    Storage::fake('local');

    $xlsx = $this->createSampleXlsx();

    $response = $this->postJson('/api/questions/validate-upload', [
        'file' => $xlsx,
    ]);

    $response->assertOk();
    $response->assertJsonStructure([
        'total_rows',
        'valid_count',
        'invalid_count',
        'rows' => [
            '*' => ['row', 'category', 'question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'marks', 'errors'],
        ],
    ]);
});

it('validates category existence', function () {
    Storage::fake('local');

    $xlsx = $this->createSampleXlsx('Nonexistent Category');

    $response = $this->postJson('/api/questions/validate-upload', [
        'file' => $xlsx,
    ]);

    $response->assertOk();
    $data = $response->json();
    expect($data['invalid_count'])->toBe(1);
    expect($data['rows'][0]['errors'])->toContain('Category not found: Nonexistent Category');
});

it('can import valid rows', function () {
    $rows = [
        [
            'category' => $this->category->name,
            'question' => 'What is 2+2?',
            'option_a' => '3',
            'option_b' => '4',
            'option_c' => '5',
            'option_d' => '6',
            'correct_answer' => 'B',
            'marks' => 1,
        ],
    ];

    $response = $this->postJson('/api/questions/bulk-import', ['rows' => $rows]);

    $response->assertOk();
    $response->assertJson(['imported' => 1, 'failed' => 0]);

    $this->assertDatabaseHas('questions', [
        'category_id' => $this->category->id,
        'text' => 'What is 2+2?',
        'type' => 'mcq',
    ]);
});

it('creates 4 options per question on import', function () {
    $rows = [
        [
            'category' => $this->category->name,
            'question' => 'Test question?',
            'option_a' => 'A1',
            'option_b' => 'B1',
            'option_c' => 'C1',
            'option_d' => 'D1',
            'correct_answer' => 'C',
            'marks' => 2,
        ],
    ];

    $this->postJson('/api/questions/bulk-import', ['rows' => $rows])->assertOk();

    $question = \App\Models\Question::where('text', 'Test question?')->first();
    expect($question->options)->toHaveCount(4);
    expect($question->options->where('is_correct', true)->first()->label)->toBe('C');
});

function createSampleXlsx(string $categoryName = 'Test Category'): UploadedFile
{
    $writer = \OpenSpout\Writer\Common\Creator\WriterEntityFactory::createXLSXWriter();
    $writer->openToPhpTemp();

    $header = \OpenSpout\Writer\Common\Creator\WriterEntityFactory::createRow([
        \OpenSpout\Writer\Common\Creator\WriterEntityFactory::createCell('Category'),
        \OpenSpout\Writer\Common\Creator\WriterEntityFactory::createCell('Question'),
        \OpenSpout\Writer\Common\Creator\WriterEntityFactory::createCell('Option A'),
        \OpenSpout\Writer\Common\Creator\WriterEntityFactory::createCell('Option B'),
        \OpenSpout\Writer\Common\Creator\WriterEntityFactory::createCell('Option C'),
        \OpenSpout\Writer\Common\Creator\WriterEntityFactory::createCell('Option D'),
        \OpenSpout\Writer\Common\Creator\WriterEntityFactory::createCell('Correct Answer'),
        \OpenSpout\Writer\Common\Creator\WriterEntityFactory::createCell('Marks'),
    ]);
    $writer->addRow($header);

    $row = \OpenSpout\Writer\Common\Creator\WriterEntityFactory::createRow([
        \OpenSpout\Writer\Common\Creator\WriterEntityFactory::createCell($categoryName),
        \OpenSpout\Writer\Common\Creator\WriterEntityFactory::createCell('What is 2+2?'),
        \OpenSpout\Writer\Common\Creator\WriterEntityFactory::createCell('3'),
        \OpenSpout\Writer\Common\Creator\WriterEntityFactory::createCell('4'),
        \OpenSpout\Writer\Common\Creator\WriterEntityFactory::createCell('5'),
        \OpenSpout\Writer\Common\Creator\WriterEntityFactory::createCell('6'),
        \OpenSpout\Writer\Common\Creator\WriterEntityFactory::createCell('B'),
        \OpenSpout\Writer\Common\Creator\WriterEntityFactory::createCell(1),
    ]);
    $writer->addRow($row);

    $writer->close();
    $tempUri = $writer->getTempFileUri();

    return UploadedFile::fake()->createWithContent('test-upload.xlsx', file_get_contents($tempUri));
}
```

- [ ] **Step 2: Run the tests**

Run: `cd api && php artisan test --compact --filter=BulkQuestionUpload`
Expected: All tests pass

- [ ] **Step 3: Run Pint**

Run: `cd api && vendor/bin/pint --dirty --format agent`
Expected: Formatted successfully

- [ ] **Step 4: Commit**

```bash
cd api && git add tests/Feature/BulkQuestionUploadTest.php && git commit -m "test: add Pest tests for bulk question upload"
```

---

### Task 6: Final Verification

- [ ] **Step 1: Run full backend test suite**

Run: `cd api && php artisan test --compact`
Expected: All tests pass

- [ ] **Step 2: Run full frontend lint + build**

Run: `cd frontend && npm run lint && npm run build`
Expected: Both pass

- [ ] **Step 3: Run Pint on all PHP files**

Run: `cd api && vendor/bin/pint --format agent`
Expected: All files formatted
