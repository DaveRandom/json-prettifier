<?php declare(strict_types=1);

namespace DaveRandom\JsonPrettifier;

use ExceptionalJSON\DecodeErrorException;
use Shitwork\Exceptions\BadRequestException;
use Shitwork\Exceptions\InternalErrorException;
use Shitwork\Exceptions\NotFoundException;
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

    /**
     * @throws BadRequestException
     * @throws InternalErrorException
     */
    public function save()
    {
        if (!$this->request->hasFormParam('json')) {
            throw new BadRequestException('Missing required form field');
        }

        try {
            $this->request->redirect('/' . $this->pasteAccessor->save($this->request->getFormParam('json')), 303);
        } catch (\Throwable $e) {
            throw new InternalErrorException('Redirect failed: ' . $e->getMessage());
        }
    }

    /**
     * @throws InternalErrorException
     * @throws NotFoundException
     */
    public function load(array $vars)
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

    /**
     * @throws BadRequestException
     * @throws InternalErrorException
     */
    public function getPhpAccessors()
    {
        try {
            $decoded = \ExceptionalJSON\decode(\file_get_contents('php://input'));
        } catch (DecodeErrorException $e) {
            throw new BadRequestException('Error decoding input JSON: ' . $e->getMessage());
        } catch (\Throwable $e) {
            throw new InternalErrorException('Unexpected error while decoding JSON: ' . $e->getMessage());
        }

        if (!\is_array($decoded)) {
            throw new BadRequestException('Supplied JSON is not an array');
        }

        $arrayLevels = [];
        $objectLevels = [];

        foreach ($decoded as $level) {
            $arrayLevels[] = \var_export($level, true);

            if (\preg_match('/^[a-z_\x7f-\xff][a-z0-9_\x7f-\xff]*$/i', (string)$level)) {
                $objectLevels[] = $level;
            } else {
                $objectLevels[] = '{' . \var_export((string)$level, true) . '}';
            }
        }

        $arrayLevels = !empty($arrayLevels) ? '[' . \implode('][', $arrayLevels) . ']' : '';
        $objectLevels = !empty($objectLevels) ? '->' . \implode('->', $objectLevels) : '';

        \header('Content-Type: application/json');
        exit(\ExceptionalJSON\encode((object)[
            'phpArray' => '$arr' . $arrayLevels,
            'phpObject' => '$obj' . $objectLevels,
        ]));
    }
}
