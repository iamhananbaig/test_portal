<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ResultResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $result = $this->result;

        return [
            'id' => $this->id,
            'test_id' => $this->test_id,
            'candidate_name' => $this->candidate_name,
            'candidate_cnic' => $this->candidate_cnic,
            'total_marks' => (float) $this->total_marks,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'submitted_at' => $this->submitted_at,
            'mcq_marks' => $result ? (float) $result->mcq_marks : null,
            'descriptive_marks' => $result ? (float) $result->descriptive_marks : null,
            'total_obtained' => $result ? (float) $result->total_obtained : null,
            'is_finalized' => $result?->is_finalized ?? false,
        ];
    }
}
