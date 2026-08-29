<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('test_questions', function (Blueprint $table) {
            $table->text('question_text')->nullable()->change();
            $table->decimal('question_marks', 5, 2)->default(1)->change();
        });
    }

    public function down(): void
    {
        Schema::table('test_questions', function (Blueprint $table) {
            $table->string('question_text')->nullable()->change();
            $table->unsignedInteger('question_marks')->default(1)->change();
        });
    }
};
