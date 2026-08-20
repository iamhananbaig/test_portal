<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('candidate_answers', function (Blueprint $table) {
            $table->decimal('awarded_marks', 5, 2)->nullable()->after('descriptive_answer');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('candidate_answers', function (Blueprint $table) {
            $table->dropColumn('awarded_marks');
        });
    }
};
