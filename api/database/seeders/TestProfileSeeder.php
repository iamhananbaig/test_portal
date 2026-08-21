<?php

namespace Database\Seeders;

use App\Models\Candidate;
use App\Models\Category;
use App\Models\TestProfile;
use App\Models\TestProfileCategory;
use Illuminate\Database\Seeder;

class TestProfileSeeder extends Seeder
{
    public function run(): void
    {
        $categories = Category::where('is_active', true)->get();

        if ($categories->isEmpty()) {
            return;
        }

        $profiles = [
            ['name' => 'Software Engineer', 'duration_minutes' => 60],
            ['name' => 'Data Analyst', 'duration_minutes' => 45],
            ['name' => 'General Aptitude', 'duration_minutes' => 30],
        ];

        foreach ($profiles as $profileData) {
            $profile = TestProfile::create($profileData);

            foreach ($categories->take(3) as $index => $category) {
                TestProfileCategory::create([
                    'test_profile_id' => $profile->id,
                    'category_id' => $category->id,
                    'question_count' => 5 + $index,
                ]);
            }
        }

        $candidates = [
            ['name' => 'Ahmed Ali', 'cnic' => '35202-1234567-1', 'email' => 'ahmed@example.com', 'phone' => '0300-1234567'],
            ['name' => 'Sara Khan', 'cnic' => '35202-7654321-2', 'email' => 'sara@example.com', 'phone' => '0301-7654321'],
            ['name' => 'Usman Malik', 'cnic' => '35202-1111111-3', 'email' => 'usman@example.com', 'phone' => '0302-1111111'],
        ];

        foreach ($candidates as $candidateData) {
            Candidate::create($candidateData);
        }
    }
}
