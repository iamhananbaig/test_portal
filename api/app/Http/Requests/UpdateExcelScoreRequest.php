<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExcelScoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'excel_score' => ['required', 'numeric', 'min:0', 'max:20'],
            'excel_remarks' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
