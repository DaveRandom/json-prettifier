<?php declare(strict_types=1);

namespace DaveRandom\JsonPrettifier;

use Shitwork\Exceptions\ForbiddenException;
use Shitwork\Exceptions\MethodNotAllowedException;
use Shitwork\Exceptions\NotFoundException;
use Shitwork\Request;
use Shitwork\Routing\Router;
use Shitwork\Template;

try {
    require __DIR__ . '/bootstrap.php';

    ($injector = \Shitwork\bootstrap())
        ->define(Router::class, [':routes' => require SRC_ROOT . '/routes.php'])
        ->make(Router::class)
        ->dispatchRequest($injector->make(Request::class))
        ->dispatch();
} catch (NotFoundException $e) {
    \header('HTTP/1.1 404 Not Found');

    (new Template(TEMPLATES_ROOT . '/error.phtml'))
        ->render(['title' => 'Not Found']);
} catch (ForbiddenException $e) {
    \header('HTTP/1.1 403 Forbidden');

    (new Template(TEMPLATES_ROOT . '/error.phtml'))
        ->render(['title' => 'Forbidden']);
} catch (MethodNotAllowedException $e) {
    \header('HTTP/1.1 405 Method Not Allowed');

    (new Template(TEMPLATES_ROOT . '/error.phtml'))
        ->render(['title' => 'Method Not Allowed']);
} catch (\Throwable $e) {
    error_log((string)$e);

    \header('HTTP/1.1 500 Internal Server Error');

    (new Template(TEMPLATES_ROOT . '/error.phtml'))
        ->render(['title' => 'Internal Server Error']);
}
