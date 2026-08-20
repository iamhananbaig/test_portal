<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('app:mark-expired-tests')->everyMinute();
