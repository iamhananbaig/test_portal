<?php

use App\Models\Candidate;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->token = auth('api')->login($this->user);
    $this->headers = ['Authorization' => "Bearer {$this->token}"];
});

it('lists candidates', function () {
    Candidate::factory()->count(3)->create();

    $response = $this->withHeaders($this->headers)
        ->getJson('/api/candidates');

    $response->assertOk()
        ->assertJsonCount(3, 'data');
});

it('creates a candidate', function () {
    $payload = [
        'name' => 'John Doe',
        'cnic' => '35201-1234567-1',
        'email' => 'john@example.com',
        'phone' => '03001234567',
    ];

    $response = $this->withHeaders($this->headers)
        ->postJson('/api/candidates', $payload);

    $response->assertCreated()
        ->assertJsonFragment(['name' => 'John Doe']);

    $this->assertDatabaseHas('candidates', ['cnic' => '35201-1234567-1']);
});

it('shows a candidate detail', function () {
    $candidate = Candidate::factory()->create();

    $response = $this->withHeaders($this->headers)
        ->getJson("/api/candidates/{$candidate->id}");

    $response->assertOk()
        ->assertJsonFragment([
            'name' => $candidate->name,
            'cnic' => $candidate->cnic,
        ])
        ->assertJsonStructure([
            'data' => ['id', 'name', 'cnic', 'email', 'phone', 'cv_path', 'tests', 'total_tests', 'average_score'],
        ]);
});

it('updates a candidate', function () {
    $candidate = Candidate::factory()->create(['name' => 'Old Name']);

    $response = $this->withHeaders($this->headers)
        ->putJson("/api/candidates/{$candidate->id}", [
            'name' => 'New Name',
            'cnic' => $candidate->cnic,
        ]);

    $response->assertOk()
        ->assertJsonFragment(['name' => 'New Name']);

    $this->assertDatabaseHas('candidates', ['id' => $candidate->id, 'name' => 'New Name']);
});

it('deletes a candidate', function () {
    $candidate = Candidate::factory()->create();

    $response = $this->withHeaders($this->headers)
        ->deleteJson("/api/candidates/{$candidate->id}");

    $response->assertOk()
        ->assertJsonFragment(['message' => 'Candidate deleted.']);

    $this->assertDatabaseMissing('candidates', ['id' => $candidate->id]);
});

it('searches candidates by name', function () {
    Candidate::factory()->create(['name' => 'Alice Smith']);
    Candidate::factory()->create(['name' => 'Bob Jones']);

    $response = $this->withHeaders($this->headers)
        ->getJson('/api/candidates?search=Alice');

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonFragment(['name' => 'Alice Smith']);
});

it('validates required fields', function () {
    $response = $this->withHeaders($this->headers)
        ->postJson('/api/candidates', []);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'cnic']);
});

it('uploads a cv file', function () {
    Storage::fake('uploads');
    $candidate = Candidate::factory()->create();

    $file = UploadedFile::fake()->create('resume.pdf', 100, 'application/pdf');

    $response = $this->withHeaders($this->headers)
        ->postJson("/api/candidates/{$candidate->id}/cv", [
            'cv' => $file,
        ]);

    $response->assertOk()
        ->assertJsonStructure(['cv_path']);

    $candidate->refresh();
    expect($candidate->cv_path)->not->toBeNull();
});

it('returns 404 when downloading non-existent cv', function () {
    Storage::fake('uploads');
    $candidate = Candidate::factory()->create(['cv_path' => null]);

    $response = $this->withHeaders($this->headers)
        ->getJson("/api/candidates/{$candidate->id}/cv");

    $response->assertNotFound();
});
