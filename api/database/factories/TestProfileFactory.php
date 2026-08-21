<?php

namespace Database\Factories;

use App\Models\TestProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TestProfile>
 */
class TestProfileFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(3, true),
            'duration_minutes' => fake()->randomElement([30, 45, 60, 90, 120]),
        ];
    }
}
