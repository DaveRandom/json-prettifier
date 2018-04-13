<?php declare(strict_types=1);

namespace DaveRandom\JsonPrettifier;

use Shitwork\Routing\Routes\Route;

return [
    Route::static('GET', '/', Controller::class, 'index'),
    Route::static('POST', '/save', Controller::class, 'save'),
    Route::static('GET', '/{id:[0-9a-zA-Z]+}', Controller::class, 'load'),
    Route::static('POST', '/php-accessors', Controller::class, 'getPhpAccessors'),
];
