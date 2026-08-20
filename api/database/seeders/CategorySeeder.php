<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = ['IQ', 'Accounting', 'Tax'];

        foreach ($categories as $name) {
            Category::updateOrCreate(
                ['name' => $name],
                ['is_active' => true],
            );
        }
    }
}
