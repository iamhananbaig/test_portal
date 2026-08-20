<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $questionId = $this->route('question')?->id;

        return [
            'category_id' => ['required', 'exists:categories,id'],
            'type' => ['required', Rule::in(['mcq', 'descriptive'])],
            'text' => ['required', 'string'],
            'image_path' => ['nullable', 'string'],
            'marks' => ['required', 'numeric', 'gt:0'],
            'is_active' => ['sometimes', 'boolean'],
            'options' => ['required_if:type,mcq', 'array', 'size:4'],
            'options.*.label' => ['required_with:options', 'string', 'size:1'],
            'options.*.text' => ['required_with:options', 'string'],
            'options.*.is_correct' => ['required_with:options', 'boolean'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($this->input('type') === 'mcq' && $this->has('options')) {
                $correctCount = collect($this->input('options'))->filter(fn ($opt) => $opt['is_correct'] ?? false)->count();
                if ($correctCount !== 1) {
                    $validator->errors()->add('options', 'MCQ must have exactly one correct option.');
                }
            }
        });
    }
}
