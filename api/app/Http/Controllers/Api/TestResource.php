<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'test_id' => $this->test_id,
            'candidate_name' => $this->candidate_name,
            'candidate_cnic' => $this->candidate_cnic,
            'candidate_id' => $this->candidate_id,
            'duration_minutes' => $this->duration_minutes,
            'total_marks' => (float) $this->total_marks,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'started_at' => $this->started_at,
            'expires_at' => $this->expires_at,
            'ends_at' => $this->ends_at,
            'submitted_at' => $this->submitted_at,
            'submission_method' => $this->submission_method,
            'candidate' => new CandidateResource($this->whenLoaded('candidate')),
            'questions' => TestQuestionResource::collection($this->whenLoaded('test_questions')),
        ];
    }
}
