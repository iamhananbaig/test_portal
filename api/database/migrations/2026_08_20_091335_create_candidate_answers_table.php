<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('candidate_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('test_id')->constrained()->cascadeOnDelete();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->foreignId('selected_option_id')->nullable()->constrained('question_options')->nullOnDelete();
            $table->text('descriptive_answer')->nullable();
            $table->boolean('is_flagged')->default(false);
            $table->unsignedInteger('time_spent_seconds')->default(0);
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->unique(['test_id', 'question_id']);
            $table->index('test_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('candidate_answers');
    }
};
