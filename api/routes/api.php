<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\QuestionController;
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
});
