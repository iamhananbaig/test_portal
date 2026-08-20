<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CandidateController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\MarkingController;
use App\Http\Controllers\Api\QuestionController;
use App\Http\Controllers\Api\ResultController;
use App\Http\Controllers\Api\TestController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['status' => 'ok']));

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:api')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    Route::apiResource('categories', CategoryController::class)->only(['index', 'store', 'update']);

    Route::apiResource('questions', QuestionController::class)->only(['index', 'show', 'store', 'update']);
    Route::put('/questions/{question}/status', [QuestionController::class, 'toggleStatus']);
    Route::post('/questions/{question}/image', [QuestionController::class, 'uploadImage']);
    Route::delete('/questions/{question}/image', [QuestionController::class, 'destroyImage']);

    Route::post('/tests/generate', [TestController::class, 'generate']);
    Route::get('/tests', [TestController::class, 'index']);
    Route::get('/tests/{test}', [TestController::class, 'show']);
    Route::post('/tests/{test}/start', [TestController::class, 'start']);

    Route::get('/marking/pending', [MarkingController::class, 'pending']);
    Route::get('/marking/{test}', [MarkingController::class, 'show']);
    Route::put('/marking/{test}', [MarkingController::class, 'saveMarks']);
    Route::post('/marking/{test}/finalize', [MarkingController::class, 'finalize']);

    Route::get('/dashboard/stats', [ResultController::class, 'dashboardStats']);
    Route::get('/results', [ResultController::class, 'index']);
    Route::get('/results/{test}', [ResultController::class, 'show']);
});

Route::prefix('candidate')->group(function () {
    Route::post('/validate', [CandidateController::class, 'validateTest']);
    Route::get('/{test}/instructions', [CandidateController::class, 'instructions']);
    Route::post('/{test}/start', [CandidateController::class, 'start']);
    Route::get('/{test}/questions', [CandidateController::class, 'questions']);
    Route::put('/{test}/answer', [CandidateController::class, 'answer']);
    Route::put('/{test}/flag', [CandidateController::class, 'flag']);
    Route::post('/{test}/submit', [CandidateController::class, 'submit']);
    Route::get('/{test}/status', [CandidateController::class, 'status']);
    Route::get('/{test}/time', [CandidateController::class, 'timeRemaining']);
});
