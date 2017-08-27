<?php declare(strict_types=1);

namespace DaveRandom\JsonPrettifier;

function base62_encode($data)
{
    $charMap = [
        'y', 'D', 'l', 'o', '8', 's', 'v', 'j', '7', 'L', 'F', 'Q', 'J', '6', '4', 'E',
        'g', 'b', 'A', 'n', '3', 'U', 'x', 'q', 'h', 'e', 'H', 'M', 'P', 'W', 'f', '1',
        'Y', 'm', 'R', '9', 'B', 'u', '5', 'K', 'V', 'c', 'C', 'N', 'T', 't', 'O', 'k',
        'Z', 'p', 'a', 'i', 'z', '2', 'G', 'r', 'd', 'w', '0', 'I', 'S', 'X',
    ];

    $base10 = \base_convert(\bin2hex($data), 16, 10);

    if ($base10 < 62) {
        return $charMap[$base10];
    }

    $retval = '';

    while ($base10 !== '0') {
        $retval = $charMap[\bcmod($base10, '62')] . $retval;
        $base10 = \bcdiv($base10, '62', 0);
    }

    return $retval;
}
