<?php

namespace Database\Factories;

use App\Models\Test;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Test>
 */
class TestFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'test_id' => strtoupper(Str::random(4).'-'.Str::random(4)),
            'candidate_name' => fake()->name(),
            'candidate_cnic' => fake()->numerify('#####-#######-#'),
            'duration_minutes' => 60,
            'total_marks' => 10,
            'status' => 'ready',
            'created_at' => now(),
            'expires_at' => now()->addHour(),
        ];
    }

    public function pendingReview(): static
    {
        return $this->state(fn () => [
            'status' => 'pending_review',
            'submitted_at' => now(),
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn () => [
            'status' => 'completed',
            'submitted_at' => now(),
        ]);
    }

    public function ready(): static
    {
        return $this->state(fn () => [
            'status' => 'ready',
        ]);
    }

    public function inProgress(): static
    {
        return $this->state(fn () => [
            'status' => 'in_progress',
            'started_at' => now(),
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn () => [
            'status' => 'expired',
            'expires_at' => now()->subMinute(),
        ]);
    }
}
