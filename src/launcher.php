<?php declare(strict_types=1);

namespace DaveRandom\JsonPrettifier;

use Shitwork\Exceptions\BadRequestException;
use Shitwork\Exceptions\ForbiddenException;
use Shitwork\Exceptions\MethodNotAllowedException;
use Shitwork\Exceptions\NotFoundException;
use Shitwork\Request;
use Shitwork\Routing\Router;
use Shitwork\TemplateFetcher;

require __DIR__ . '/bootstrap.php';

($injector = \Shitwork\bootstrap())
    ->define(Router::class, [':routes' => require SRC_ROOT . '/routes.php'])
    ->define(TemplateFetcher::class, [':path' => TEMPLATE_PATTERN])
    ->define(PasteAccessor::class, [':storageDirectory' => SAVE_DIR]);

try {
    $injector
        ->make(Router::class)
        ->dispatchRequest($injector->make(Request::class))
        ->dispatch();
} catch (BadRequestException $e) {
    error_log((string)$e);

    \header('HTTP/1.1 400 Bad Request');

    $injector->make(TemplateFetcher::class)
        ->fetch('error')
        ->render(['title' => 'Bad Request']);
} catch (NotFoundException $e) {
    \header('HTTP/1.1 404 Not Found');

    $injector->make(TemplateFetcher::class)
        ->fetch('error')
        ->render(['title' => 'Not Found']);
} catch (ForbiddenException $e) {
    \header('HTTP/1.1 403 Forbidden');

    $injector->make(TemplateFetcher::class)
        ->fetch('error')
        ->render(['title' => 'Forbidden']);
} catch (MethodNotAllowedException $e) {
    \header('HTTP/1.1 405 Method Not Allowed');

    $injector->make(TemplateFetcher::class)
        ->fetch('error')
        ->render(['title' => 'Method Not Allowed']);
} catch (\Throwable $e) {
    error_log((string)$e);

    \header('HTTP/1.1 500 Internal Server Error');

    $injector->make(TemplateFetcher::class)
        ->fetch('error')
        ->render(['title' => 'Internal Server Error']);
}
