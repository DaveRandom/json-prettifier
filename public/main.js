(function() {
    'use strict';

    function getAccessorStrings(path, callback)
    {
        function makeJavascriptAccessorString(path)
        {
            return 'obj' + path.map(function(level) {
                return /^[_a-z][_a-z0-9]*$/i.test(String(level))
                    ? '.' + level
                    : '[' + JSON.stringify(level) + ']';
            }).join('');
        }

        function handleHttpResponse()
        {
            if (xhr.readyState !== XMLHttpRequest.DONE) {
                return;
            }

            if (xhr.status !== 200) {
                console.error('HTTP request to fetch PHP accessor strings failed: HTTP ' + xhr.status);
                return;
            }

            var decoded;

            try {
                decoded = JSON.parse(xhr.responseText);
            } catch (e) {
                console.error('HTTP request to fetch PHP accessor strings failed: Parse error: ' + e.message);
                return;
            }

            if (typeof decoded.phpArray !== 'string' || typeof decoded.phpObject !== 'string') {
                console.error('HTTP request to fetch PHP accessor strings failed: Response object not in expected format');
                return;
            }

            path.accessorStrings = {
                javascript: makeJavascriptAccessorString(path),
                phpArray: decoded.phpArray,
                phpObject: decoded.phpObject,
            };

            callback(path.accessorStrings);
        }

        if (typeof path.accessorStrings !== 'undefined') {
            callback(path.accessorStrings);
            return;
        }

        var xhr = new XMLHttpRequest();

        xhr.open('POST', '/php-accessors');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onreadystatechange = handleHttpResponse;
        xhr.send(JSON.stringify(path));
    }

    function createInputSectionManager(selector)
    {
        var sectionElement = document.querySelector(selector);

        if (!sectionElement) {
            throw new Error('Unable to get reference to input section from selector: ' + selector);
        }

        var textAreaElement = sectionElement.querySelector('textarea');

        if (!textAreaElement) {
            throw new Error('Unable to get reference to input text area');
        }

        return {
            collapse: function() {
                sectionElement.classList.add('collapsed');
            },
            isEmpty: function() {
                return /^\s*$/.test(textAreaElement.value);
            },
            getData: function() {
                try {
                    return JSON.parse(textAreaElement.value);
                } catch(e) {
                    throw new Error('Parse Error: ' + e.message);
                }
            },
        };
    }

    function createOutputSectionManager(selector)
    {
        function replaceAllChildrenWithNode(element, newChild)
        {
            while (element.childNodes.length) {
                element.removeChild(element.firstChild);
            }

            element.appendChild(newChild);
        }

        function valueClickHandler(ev, path)
        {
            ev.stopPropagation();

            tooltip.hide();

            var targetTop = ev.target.getBoundingClientRect().top + window.scrollY,
                targetLeft = ev.pageX;

            getAccessorStrings(path, function (strings) {
                tooltip.show(targetTop, targetLeft, strings);
            });
        }

        function updateContent(className, newContent)
        {
            tooltip.hide();

            outputElement.classList.remove(CLASS_WORKING, CLASS_OUTPUT, CLASS_ERROR);
            outputElement.classList.add(className);

            replaceAllChildrenWithNode(outputElement, newContent);

            sectionElement.classList.remove('hidden');
        }

        // "Constants"
        var CLASS_WORKING = 'working-message';
        var CLASS_OUTPUT = 'pretty-json';
        var CLASS_ERROR = 'error-message';

        // Make sure the selector we were given makes sense
        var sectionElement = document.querySelector(selector);
        if (!sectionElement) {
            throw new Error('Unable to get reference to output section from selector: ' + selector);
        }

        // Create the new container structure in the section
        var containerElement = sectionElement.appendChild(document.createElement('div'));
        var outputElement = containerElement.appendChild(document.createElement('div'));
        containerElement.classList.add('container');
        outputElement.classList.add('soft-corner');
        replaceAllChildrenWithNode(sectionElement, containerElement);

        // Create the tooltip controller (used by valueClickHandler() and updateContent() above)
        var tooltip = JSONPrettifier.Tooltip.create(outputElement, {
            javascript: "Javascript",
            phpArray: "PHP Array",
            phpObject: "PHP Object",
        });

        return {
            setWorking: function() {
                updateContent(CLASS_WORKING, document.createTextNode('Working...'));
            },

            setOutput: function(prettifyResult) {
                prettifyResult.addEventListener('value-click', valueClickHandler);
                updateContent(CLASS_OUTPUT, prettifyResult.rootElement);
            },

            setError: function(message) {
                updateContent(CLASS_ERROR, document.createTextNode('Error: ' + message));
            },
        };
    }

    function attachButtonHandlers(selector, inputSection, outputSection)
    {
        function prettifyInput()
        {
            try {
                inputSection.collapse();

                if (container.contains(saveButton)) {
                    container.removeChild(saveButton);
                }

                outputSection.setWorking();
                outputSection.setOutput(JSON.prettify(inputSection.getData()));

                container.appendChild(saveButton);
            } catch(ex) {
                outputSection.setError(ex.message);
            }
        }

        var container = document.querySelector(selector);
        if (!container) {
            throw new Error('Unable to get reference to button container from selector: ' + selector);
        }

        var prettifyButton = container.querySelector('button');
        if (!prettifyButton) {
            throw new Error('Unable to get reference to prettify button');
        }

        var saveButton = document.createElement('button');
        saveButton.appendChild(document.createTextNode('Save'));

        prettifyButton.addEventListener('click', function(ev) {
            ev.preventDefault();

            if (!inputSection.isEmpty()) {
                prettifyInput();
            }
        });
    }

    (function() {
        var input = createInputSectionManager('#input-section'),
            output = createOutputSectionManager('#output-section');

        if (input.isEmpty()) {
            attachButtonHandlers('#button-container', input, output);
            return;
        }

        try {
            output.setWorking();
            output.setOutput(JSON.prettify(input.getData()));
        } catch(ex) {
            output.setError(ex.message);
        }
    }());
}());
