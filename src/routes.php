<?php declare(strict_types=1);

namespace DaveRandom\JsonPrettifier;

use DaveRandom\JsonPrettifier\Controllers\Controller;
use Shitwork\Routing\Routes\Route;

return [
    Route::static('GET', '/', Controller::class, 'index'),
    Route::static('POST', '/save', Controller::class, 'save'),
    Route::static('GET', '/{id:[0-9a-zA-Z]+}', Controller::class, 'load'),
];
