<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['test_id', 'question_id', 'category_id', 'display_order'])]
class TestQuestion extends Model
{
    use HasFactory;

    public $timestamps = false;

    public function test(): BelongsTo
    {
        return $this->belongsTo(Test::class);
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
