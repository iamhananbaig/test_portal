<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TestQuestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'question_id' => $this->question_id,
            'category_id' => $this->category_id,
            'display_order' => $this->display_order,
            'question' => new QuestionResource($this->whenLoaded('question')),
            'category' => new CategoryResource($this->whenLoaded('category')),
        ];
    }
}
