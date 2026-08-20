<?php

namespace Database\Factories;

use App\Models\CandidateAnswer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CandidateAnswer>
 */
class CandidateAnswerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'is_flagged' => false,
            'time_spent_seconds' => fake()->numberBetween(0, 120),
        ];
    }
}
