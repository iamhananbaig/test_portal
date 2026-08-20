<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'test_id',
    'candidate_name',
    'candidate_cnic',
    'duration_minutes',
    'total_marks',
    'status',
    'started_at',
    'expires_at',
    'ends_at',
    'submitted_at',
    'submission_method',
])]
#[Hidden([])]
class Test extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'total_marks' => 'decimal:2',
            'duration_minutes' => 'integer',
            'started_at' => 'datetime',
            'expires_at' => 'datetime',
            'ends_at' => 'datetime',
            'submitted_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function test_questions(): HasMany
    {
        return $this->hasMany(TestQuestion::class);
    }

    public function questions(): HasManyThrough
    {
        return $this->hasManyThrough(Question::class, TestQuestion::class);
    }

    public function candidateAnswers(): HasMany
    {
        return $this->hasMany(CandidateAnswer::class);
    }

    public function result(): HasOne
    {
        return $this->hasOne(Result::class);
    }

    public function scopeByStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }
}
