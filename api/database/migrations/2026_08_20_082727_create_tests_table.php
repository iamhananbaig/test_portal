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
        Schema::create('tests', function (Blueprint $table) {
            $table->id();
            $table->string('test_id', 8)->unique();
            $table->string('candidate_name');
            $table->string('candidate_cnic', 15);
            $table->integer('duration_minutes');
            $table->decimal('total_marks', 7, 2)->default(0);
            $table->enum('status', ['ready', 'expired', 'in_progress', 'submitted', 'auto_submitted', 'pending_review', 'completed'])->default('ready');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->enum('submission_method', ['manual', 'auto', 'admin'])->nullable();

            $table->index('status');
            $table->index('candidate_cnic');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tests');
    }
};
