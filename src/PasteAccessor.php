<?php declare(strict_types=1);

namespace DaveRandom\JsonPrettifier;

use ExceptionalJSON\DecodeErrorException;
use Shitwork\Exceptions\BadRequestException;
use Shitwork\Exceptions\InternalErrorException;
use Shitwork\Routing\Exceptions\NotFoundException;

final class PasteAccessor
{
    private $storageDirectory;

    public function __construct(string $storageDirectory)
    {
        $this->storageDirectory = $storageDirectory;
    }

    public function save(string $data): string
    {
        try {
            \ExceptionalJSON\decode($data);
        } catch (DecodeErrorException $e) {
            throw new BadRequestException('Invalid JSON input');
        }

        do {
            $id = base62_encode(\random_bytes(16));
        } while (\is_file($path = "{$this->storageDirectory}/{$id}.json"));

        if (!\file_put_contents($path, $data)) {
            throw new InternalErrorException('Saving file failed!');
        }

        return $id;
    }

    public function load(string $id): string
    {
        $path = "{$this->storageDirectory}/{$id}.json";

        if (!\is_file($path)) {
            throw new NotFoundException('Paste not found');
        }

        if (false === $json = \file_get_contents($path)) {
            throw new InternalErrorException('Reading file failed');
        }

        return $json;
    }
}
