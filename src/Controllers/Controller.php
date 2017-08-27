<?php declare(strict_types=1);

namespace DaveRandom\JsonPrettifier\Controllers;

use function DaveRandom\JsonPrettifier\base62_encode;
use const DaveRandom\JsonPrettifier\SAVE_DIR;
use Shitwork\Exceptions\BadRequestException;
use Shitwork\Exceptions\InternalErrorException;
use Shitwork\Exceptions\NotFoundException;
use Shitwork\Request;
use Shitwork\Template;
use const DaveRandom\JsonPrettifier\TEMPLATES_ROOT;

class Controller extends \Shitwork\Controller
{
    private $request;

    public function __construct(Request $request)
    {
        $this->request = $request;
    }

    public function index()
    {
        (new Template(TEMPLATES_ROOT . '/index.phtml'))->render();
    }

    public function save()
    {
        if (!$this->request->hasFormParam('json')) {
            throw new BadRequestException('Missing required form field');
        }

        do {
            $id = base62_encode(\random_bytes(16));
        } while (\is_file($path = SAVE_DIR . "/{$id}.json"));

        if (!\file_put_contents($path, $this->request->getFormParam('json'))) {
            throw new InternalErrorException('Saving file failed!');
        }

        $this->request->redirect('/' . $id, 303);
    }

    public function load($vars)
    {
        if (!isset($vars['id'])) {
            throw new InternalErrorException('Paste ID not defined');
        }

        $path = SAVE_DIR . "/{$vars['id']}.json";

        if (!\is_file($path)) {
            throw new NotFoundException('Paste not found');
        }

        if (false === $json = \file_get_contents($path)) {
            throw new InternalErrorException('Reading file failed');
        }

        (new Template(TEMPLATES_ROOT . '/index.phtml'))->render(['json' => $json]);
    }
}
