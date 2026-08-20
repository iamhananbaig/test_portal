<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        $token = JWTAuth::attempt($credentials);

        if (! $token) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $user = JWTAuth::user();

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(): JsonResponse
    {
        JWTAuth::invalidate(JWTAuth::getToken());

        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }
}
