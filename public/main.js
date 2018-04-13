(function() {
    'use strict';

    var validJsNameExpr = /^[_a-z][_a-z0-9]*$/i;
    var validPhpNameExpr = /^[a-z_\x7f-\xff][a-z0-9_\x7f-\xff]*$/i;

    function getAccessorStrings(path, callback)
    {
        if (typeof path.accessorStrings !== 'undefined') {
            callback(path.accessorStrings);
            return;
        }

        var jsString = 'obj',
            phpArrayString = '$arr',
            phpObjectString = '$obj',
            key;

        for (var i = 0; i < path.length; i++) {
            if (typeof path[i] === 'number') {
                jsString += '[' + path[i] + ']';
                phpArrayString += '[' + path[i] + ']';
                phpObjectString += '[' + path[i] + ']';
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

        path.accessorStrings = {
            javascript: jsString,
            phpArray: phpArrayString,
            phpObject: phpObjectString,
        };

        callback(path.accessorStrings);
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
