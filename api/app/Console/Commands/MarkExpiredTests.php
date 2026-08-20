<?php

namespace App\Console\Commands;

use App\Models\Test;
use Illuminate\Console\Command;

class MarkExpiredTests extends Command
{
    protected $signature = 'app:mark-expired-tests';

    protected $description = 'Mark ready tests as expired past their expires_at time';

    public function handle(): int
    {
        $expiredCount = Test::query()
            ->where('status', 'ready')
            ->where('expires_at', '<', now())
            ->update(['status' => 'expired']);

        if ($expiredCount > 0) {
            $this->info("Marked {$expiredCount} test(s) as expired.");
        }

        return Command::SUCCESS;
    }
}
