<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTestProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:test_profiles,name'],
            'duration_minutes' => ['required', 'integer', 'min:1'],
            'categories' => ['required', 'array', 'min:1'],
            'categories.*.category_id' => ['required', 'exists:categories,id'],
            'categories.*.question_count' => ['required', 'integer', 'min:1'],
        ];
    }
}
