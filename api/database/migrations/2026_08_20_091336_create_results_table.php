<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('test_id')->unique()->constrained()->cascadeOnDelete();
            $table->decimal('mcq_marks', 7, 2)->default(0);
            $table->decimal('descriptive_marks', 7, 2)->default(0);
            $table->decimal('total_obtained', 7, 2)->default(0);
            $table->boolean('is_finalized')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('results');
    }
};
