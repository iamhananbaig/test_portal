<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Question;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Question>
 */
class QuestionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'category_id' => Category::factory(),
            'type' => 'mcq',
            'text' => fake()->sentence(),
            'marks' => rand(1, 5),
            'is_active' => true,
        ];
    }

    public function mcq(): static
    {
        return $this->state(fn () => ['type' => 'mcq']);
    }

    public function descriptive(): static
    {
        return $this->state(fn () => ['type' => 'descriptive']);
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
