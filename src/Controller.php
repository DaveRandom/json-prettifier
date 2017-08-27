<?php declare(strict_types=1);

namespace DaveRandom\JsonPrettifier;

use Shitwork\Exceptions\BadRequestException;
use Shitwork\Exceptions\InternalErrorException;
use Shitwork\Request;
use Shitwork\TemplateFetcher;

final class Controller extends \Shitwork\Controller
{
    private $request;
    private $templateFetcher;
    private $pasteAccessor;

    public function __construct(Request $request, TemplateFetcher $templateFetcher, PasteAccessor $pasteAccessor)
    {
        $this->request = $request;
        $this->templateFetcher = $templateFetcher;
        $this->pasteAccessor = $pasteAccessor;
    }

    public function index()
    {
        $this->templateFetcher
            ->fetch('index')
            ->render();
    }

    public function save()
    {
        if (!$this->request->hasFormParam('json')) {
            throw new BadRequestException('Missing required form field');
        }

        $this->request->redirect('/' . $this->pasteAccessor->save($this->request->getFormParam('json')), 303);
    }

    public function load($vars)
    {
        if (!isset($vars['id'])) {
            throw new InternalErrorException('Paste ID not defined');
        }

        $this->templateFetcher
            ->fetch('index')
            ->render([
                'json' => $this->pasteAccessor->load($vars['id']),
            ]);
    }
}
