<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CandidateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'cnic' => $this->cnic,
            'email' => $this->email,
            'phone' => $this->phone,
            'cv_path' => $this->cv_path,
            'excel_score' => $this->excel_score ? (float) $this->excel_score : null,
            'excel_remarks' => $this->excel_remarks,
            'tests_count' => $this->whenCounted('tests'),
            'created_at' => $this->created_at,
        ];
    }
}
