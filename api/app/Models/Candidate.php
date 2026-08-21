<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'cnic', 'email', 'phone', 'cv_path'])]
#[Hidden([])]
class Candidate extends Model
{
    use HasFactory;

    public function tests(): HasMany
    {
        return $this->hasMany(Test::class);
    }
}
