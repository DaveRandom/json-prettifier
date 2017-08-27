(function() {

    var saveButtonVisible = false,
        saveButton = document.createElement('button'),
        prettifyButton = document.getElementById('prettify'),
        input = document.getElementById('input'),
        output = document.getElementById('output'),
        valueTooltip = document.getElementById('value-tooltip'),
        javascriptAccessor = document.getElementById('javascript-accessor'),
        phpArrayAccessor = document.getElementById('php-array-accessor'),
        phpObjectAccessor = document.getElementById('php-object-accessor');

    var validJsNameExpr = /^[_a-z][_a-z0-9]*$/i;
    var validPhpNameExpr = /^[a-z_\x7f-\xff][a-z0-9_\x7f-\xff]*$/i;

    function createAccessorStrings(path)
    {
        var jsString = 'obj',
            phpArrayString = '$arr',
            phpObjectString = '$obj',
            key;

        for (var i = 0; i < path.length; i++) {
            if (path[i] instanceof Array) {
                jsString += '[' + path[i][0] + ']';
                phpArrayString += '[' + path[i][0] + ']';
                phpObjectString += '[' + path[i][0] + ']';
                continue;
            }

            key = JSON.stringify(path[i]);

            jsString += validJsNameExpr.test(path[i])
                ? '.' + path[i]
                : '[' + key + ']';

            phpArrayString += '[' + key + ']';

            if (validPhpNameExpr.test(path[i])) {
                phpObjectString +=  '->' + path[i];
            } else {
                phpObjectString +=  '->{' + key + '}';
            }
        }

        return {
            javascript: jsString,
            phpArray: phpArrayString,
            phpObject: phpObjectString,
        };
    }

    function valueClickHandler(e, path)
    {
        e.stopPropagation();

        valueTooltip.style.visibility = 'hidden';
        valueTooltip.style.left = '0';
        valueTooltip.style.top = '0';

        var strings = createAccessorStrings(path);
        javascriptAccessor.innerText = strings.javascript;
        phpObjectAccessor.innerText = strings.phpObject;
        phpArrayAccessor.innerText = strings.phpArray;

        var toolTipWidth = valueTooltip.clientWidth;
        var toolTipHeight = valueTooltip.clientHeight;
        var targetTop = e.target.getBoundingClientRect().top + document.body.scrollTop;
        var outputRect = output.getBoundingClientRect();

        var left = Math.max(
            outputRect.left,
            Math.min(
                Math.round(e.pageX - (toolTipWidth / 2)),
                (outputRect.left + outputRect.width) - toolTipWidth
            )
        );

        var top = Math.round(targetTop - (toolTipHeight + 3));

        if (top < 0) {
            top = 0;
        }

        valueTooltip.style.left = left + 'px';
        valueTooltip.style.top = top + 'px';
        valueTooltip.style.visibility = 'visible';
    }

    function outputClickHandler()
    {
        valueTooltip.style.visibility = 'hidden';
    }

    function clearContents(el)
    {
        while (el.childNodes.length) {
            el.removeChild(el.firstChild);
        }
    }

    function parseInput(input)
    {
        try {
            return JSON.parse(input.value);
        } catch(e) {
            throw new Error('Parse Error: ' + e.message);
        }
    }

    function prettifyInput(e)
    {
        try {
            if (saveButtonVisible) {
                saveButton.parentNode.removeChild(saveButton);
                saveButtonVisible = false;
            }

            clearContents(output);

            output.classList.add('working-message');
            output.style.display = 'block';
            output.classList.remove('pretty-json');
            output.classList.remove('error-message');
            output.appendChild(document.createTextNode('Working...'));

            var data = parseInput(input);
            clearContents(output);

            output.classList.add('pretty-json');
            output.classList.remove('working-message');

            var result = JSON.prettify(data);
            result.addEventListener('value-click', valueClickHandler);

            output.appendChild(result.rootElement);

            if (e && !saveButtonVisible) {
                prettifyButton.parentNode.appendChild(saveButton);
                saveButtonVisible = true;
            }
        } catch(e) {
            clearContents(output);
            output.classList.remove('pretty-json');
            output.classList.remove('working-message');
            output.classList.add('error-message');
            output.appendChild(document.createTextNode('Error: ' + e.message));
        }

        if (e) {
            e.preventDefault();
        }
    }

    saveButton.appendChild(document.createTextNode('Save'));
    prettifyButton.addEventListener('click', prettifyInput);

    if (input.value !== '') {
        prettifyInput();
    }

    output.addEventListener('click', outputClickHandler);

}());
