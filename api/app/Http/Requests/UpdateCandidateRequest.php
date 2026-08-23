<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCandidateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'cnic' => ['required', 'string', 'size:15', 'unique:candidates,cnic,'.$this->route('candidate')->id],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'excel_score' => ['nullable', 'numeric', 'min:0', 'max:20'],
            'excel_remarks' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
