<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['test_id', 'mcq_marks', 'descriptive_marks', 'total_obtained', 'is_finalized'])]
#[Hidden([])]
class Result extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'mcq_marks' => 'decimal:2',
            'descriptive_marks' => 'decimal:2',
            'total_obtained' => 'decimal:2',
            'is_finalized' => 'boolean',
        ];
    }

    public function test(): BelongsTo
    {
        return $this->belongsTo(Test::class);
    }
}
