var PrettyJSON = {};

(function() {
    'use strict';

    /**
     * @callback VectorMemberEncodingCallback
     * @param {string} value
     * @param {string|int} key
     */

    /**
     * @typedef {Object} EncodingOptions
     * @property {int} indentIncrement
     * @property {string} indentChar
     */

    /**
     * @typedef {Object} EncodingResult
     * @property {HTMLElement} rootElement
     * @property {Function} addEventListener
     */

    /**
     * @typedef {EncodingResult} EncodingState
     * @property {Array} path
     * @property {int} currentLineNo
     * @property {HTMLElement} currentLineFoldControl
     * @property {Function} triggerEvent
     * @property {Function} toPublicInterface
     * @property {Function} getIndentForNewLine
     * @property {Function} incrementIndent
     * @property {Function} decrementIndent
     */

    /**
     * @typedef {Object} SpanCreationOptions
     * @property {string[]} [classList]
     * @property {string|string[]|Node|Node[]} [content]
     * @property {string} [title]
     */

    /**
     * @param {Object} obj
     * @returns {boolean}
     */
    function isEncodable(obj)
    {
        return ['object', 'string', 'number', 'boolean'].indexOf(typeof obj) >= 0;
    }

    /**
     * @param {Object} obj
     * @returns {boolean}
     */
    function isScalar(obj)
    {
        return obj === null || ['string', 'number', 'boolean'].indexOf(typeof obj) >= 0;
    }

    /**
     * @param {HTMLElement} wrapper
     * @param {EncodingState} state
     */
    function attachValueClickHandler(wrapper, state)
    {
        // Make a copy of the path array so it doesn't mutate before the event is fired
        var path = state.path.slice();

        wrapper.addEventListener('click', function(e) {
            // Make a copy of the path array again so it isn't mutated by a handler
            state.triggerEvent('value-click', e, path.slice());
        });
    }

    /**
     * @param {HTMLElement} foldControl
     * @param {HTMLElement} objectBody
     */
    function attachFoldControlClickHandler(foldControl, objectBody)
    {
        foldControl.classList.add('unfolded');

        foldControl.addEventListener('click', function() {
            if (foldControl.classList.contains('unfolded')) {
                foldControl.classList.remove('unfolded');
                foldControl.classList.add('folded');
                objectBody.classList.add('folded');
            } else {
                foldControl.classList.remove('folded');
                foldControl.classList.add('unfolded');
                objectBody.classList.remove('folded');
            }
        });
    }

    /**
     * @param {HTMLElement} openBrace
     * @param {HTMLElement} closeBrace
     */
    function attachBraceMatchRolloverHandlers(openBrace, closeBrace)
    {
        function mouseOverHandler()
        {
            openBrace.classList.add('enclosure-active');
            closeBrace.classList.add('enclosure-active');
        }

        function mouseOutHandler()
        {
            openBrace.classList.remove('enclosure-active');
            closeBrace.classList.remove('enclosure-active');
        }

        openBrace.addEventListener('mouseover', mouseOverHandler);
        openBrace.addEventListener('mouseout', mouseOutHandler);
        closeBrace.addEventListener('mouseover', mouseOverHandler);
        closeBrace.addEventListener('mouseout', mouseOutHandler);
    }

    /**
     * @param {EncodingState} state
     * @param {HTMLElement} [container]
     */
    function beginLine(state, container)
    {
        var indent = state.getIndentForNewLine();
        container = container || state.rootElement;

        var lineNo = span({
            classList: ['line-number'],
            content: String(state.currentLineNo),
        });

        var nodes = [state.currentLineFoldControl, lineNo];

        if (indent !== null) {
            nodes.unshift(document.createTextNode('\n'));
            nodes.push(document.createTextNode(indent));
        }

        nodes.forEach(function(node) {
            container.appendChild(node);
        });
    }

    /**
     * @param {string} str
     * @returns {Node[]|null}
     */
    function extractLinks(str)
    {
        function encodePartialString(text)
        {
            return JSON.stringify(text).slice(1, -1);
        }

        function appendText(parts, text)
        {
            var encodedText = encodePartialString(text);

            if (encodedText !== '') {
                parts.push(document.createTextNode(encodedText));
            }
        }

        var match, parts = [], p = 0;
        var expr = /\bhttps?:\/\/[^\/]+\/\S*/g;

        while (match = expr.exec(str)) {
            if (p < match.index) {
                appendText(parts, str.slice(p, match.index));
            }

            p = match.index + match[0].length;

            var anchor = document.createElement('a');
            anchor.href = match[0];
            anchor.target = '_blank';
            anchor.appendChild(document.createTextNode(encodePartialString(match[0])));

            parts.push(anchor);
        }

        if (!parts.length) {
            return null;
        }

        if (p < str.length) {
            appendText(parts, str.slice(p));
        }

        return parts;
    }

    /**
     * @param {EncodingOptions} [options]
     * @returns {EncodingState}
     */
    function createStateObject(options)
    {
        var eventHandlers = {};

        var indent = 0;
        var indentIncrement = Number(options.indentIncrement || 4);
        var indentChar = String(options.indentChar || ' ').charAt(0) || ' ';

        var state = {
            rootElement: document.createElement('div'),
            path: [],
            currentLineNo: 0,
            currentLineFoldControl: null,

            addEventListener: function(name, callback) {
                if (eventHandlers[name] === undefined) {
                    eventHandlers[name] = [];
                }
                eventHandlers[name].push(callback);
            },

            triggerEvent: function(name) {
                if (eventHandlers[name] === undefined) {
                    return;
                }
                var args = Array.prototype.slice.call(arguments, 1);
                for (var i = 0; i < eventHandlers[name].length; i++) {
                    eventHandlers[name][i].apply(null, args)
                }
            },

            toPublicInterface: function() {
                return {
                    rootElement: state.rootElement,
                    addEventListener: state.addEventListener,
                };
            },

            getIndentForNewLine: function() {
                state.currentLineFoldControl = span({
                    classList: ['fold-control'],
                });

                if (state.currentLineNo++ === 0) {
                    return null;
                }

                var padding = '';

                for (var i = 0; i < indent; i++) {
                    padding += indentChar;
                }

                return padding;
            },

            incrementIndent: function() {
                indent += indentIncrement;
            },

            decrementIndent: function() {
                indent -= indentIncrement;
            },
        };

        state.rootElement.classList.add('pretty-json-container');

        return state;
    }

    /**
     * @param {SpanCreationOptions} [options]
     * @returns {HTMLElement}
     */
    function span(options)
    {
        function normalizeContent(content, result)
        {
            result = result || [];

            if (typeof content === 'string') {
                content = document.createTextNode(content)
            }

            if (content instanceof Array) {
                for (var i = 0; i < content.length; i++) {
                    normalizeContent(content[i], result);
                }
            } else if (content instanceof Node) {
                result.push(content);
            }

            return result;
        }

        var span = document.createElement('span');

        (options.classList || []).forEach(function(className) {
            span.classList.add(String(className));
        });

        normalizeContent(options.content).forEach(function(node) {
            span.appendChild(node);
        });

        if (options.hasOwnProperty('title')) {
            span.title = String(options.title);
        }

        return span;
    }

    /**
     * @param {Node[]} parts
     * @param {EncodingState} state
     * @param {boolean} isValue
     * @param {string} title
     * @returns {HTMLElement}
     */
    function encodeStringValueWithLinks(parts, state, isValue, title)
    {
        var wrapper = span({
            classList: ['value-string'],
            title: title,
        });

        if (isValue) {
            wrapper.classList.add('json-value');
            attachValueClickHandler(wrapper, state);
        }

        wrapper.appendChild(document.createTextNode('"'));

        for (var i = 0, l = parts.length; i < l; i++) {
            wrapper.appendChild(parts[i]);
        }

        wrapper.appendChild(document.createTextNode('"'));

        return wrapper;
    }

    /**
     * @param {Object} value
     * @param {EncodingState} state
     * @param {boolean} isValue
     * @returns {HTMLElement}
     */
    function encodeScalarValue(value, state, isValue)
    {
        var linkParts;
        var type = value !== null
            ? typeof value
            : 'null';
        var title = type.slice(0, 1).toUpperCase() + type.slice(1);
        var encoded = JSON.stringify(value);

        if (typeof value === 'string') {
            title = 'String (' + value.length + ' characters';

            if (encoded.length !== (value.length + 2)) {
                title += ', ' + (encoded.length - 2) + ' characters encoded';
            }

            title += ')';

            if ((linkParts = extractLinks(value))) {
                return encodeStringValueWithLinks(linkParts, state, isValue, title);
            }
        }

        var wrapper = span({
            classList: ['value-' + type],
            title: title,
        });

        if (isValue) {
            wrapper.classList.add('json-value');
            attachValueClickHandler(wrapper, state);
        }

        wrapper.appendChild(document.createTextNode(encoded));

        return wrapper;
    }

    /**
     * @param {Object} obj
     * @param {EncodingState} state
     * @param {VectorMemberEncodingCallback} callback
     * @returns {HTMLElement}
     */
    function encodeVectorMembers(obj, state, callback)
    {
        var type = obj instanceof Array ? 'array' : 'object';
        var counter = 0;
        var container = span({classList: ['vector-body', type + '-body']});
        var foldControl = state.currentLineFoldControl;

        state.incrementIndent();

        for (var key in obj) {
            if (!obj.hasOwnProperty(key) || !isEncodable(obj[key])) {
                continue;
            }

            var value = obj[key];

            if (obj instanceof Array) {
                if (String(Number(key)) !== String(key)) {
                    continue;
                }

                key = Number(key);
            }

            beginLine(state, container);

            state.path.push(key);
            container.appendChild(callback(value, key));
            state.path.pop();

            counter++;
        }

        state.decrementIndent();

        // remove trailing comma and add trailing new line
        if (container.lastChild) {
            container.lastChild.removeChild(container.lastChild.lastChild);
            beginLine(state, container);
            attachFoldControlClickHandler(foldControl, container);
        }

        container.setAttribute('data-member-count', String(counter));

        return container;
    }

    /**
     * @param {Object} value
     * @param {EncodingState} state
     * @returns {HTMLElement}
     */
    function encodeArrayMember(value, state)
    {
        var container = span({classList: ['vector-member', 'array-member']});

        container.appendChild(encodeValue(value, state));

        container.appendChild(span({
            content: ',',
            classList: ['json-grammar', 'delimiter', 'array-delimiter'],
        }));

        return container;
    }

    /**
     * @param {Array} arr
     * @param {EncodingState} state
     * @returns {HTMLElement}
     */
    function encodeArray(arr, state)
    {
        var container = span({classList:['vector', 'array']});

        var body = encodeVectorMembers(arr, state, function(value) {
            return encodeArrayMember(value, state);
        });
        var memberCount = Number(body.getAttribute('data-member-count'));

        var braceTitle = 'Array (' + memberCount + ' element' + (memberCount === 1 ? '' : 's') + ')';

        var openBrace = span({
            content: '[',
            classList: ['json-grammar', 'enclosure', 'array-enclosure', 'array-open', 'json-value'],
            title: braceTitle,
        });
        var closeBrace = span({
            content: ']',
            classList: ['json-grammar', 'enclosure', 'array-enclosure', 'array-close', 'json-value'],
            title: braceTitle,
        });

        attachValueClickHandler(openBrace, state);
        attachValueClickHandler(closeBrace, state);

        attachBraceMatchRolloverHandlers(openBrace, closeBrace);

        container.appendChild(openBrace);

        if (memberCount > 0) {
            container.appendChild(body);
        }

        container.appendChild(closeBrace);

        return container;
    }

    /**
     * @param {string} key
     * @param {Object} value
     * @param {EncodingState} state
     * @returns {HTMLElement}
     */
    function encodeObjectMember(key, value, state)
    {
        var member = span({classList: ['vector-member', 'object-member']});

        member
            .appendChild(span({classList: ['object-member-key']}))
            .appendChild(encodeScalarValue(key, state, false))
        ;

        member.appendChild(document.createTextNode(' '));
        member.appendChild(span({
            content: ':',
            classList: ['json-grammar', 'delimiter', 'object-delimiter', 'object-member-value-delimiter'],
        }));
        member.appendChild(document.createTextNode(' '));

        member
            .appendChild(span({classList: ['vector-member-value', 'object-member-value']}))
            .appendChild(encodeValue(value, state))
        ;

        member.appendChild(span({
            content: ',',
            classList: ['json-grammar', 'delimiter', 'object-delimiter', 'object-member-delimiter'],
        }));

        return member;
    }

    /**
     * @param {Object} obj
     * @param {EncodingState} state
     */
    function encodeObject(obj, state)
    {
        var container = span({classList: ['vector', 'object']});

        var body = encodeVectorMembers(obj, state, function(value, key) {
            return encodeObjectMember(key, value, state);
        });
        var memberCount = Number(body.getAttribute('data-member-count'));

        var braceTitle = 'Object (' + memberCount + ' member' + (memberCount === 1 ? '' : 's') + ')';

        var openBrace = span({
            content: '{',
            classList: ['json-grammar', 'enclosure', 'object-enclosure', 'object-open', 'json-value'],
            title: braceTitle,
        });

        var closeBrace = span({
            content: '}',
            classList: ['json-grammar', 'enclosure', 'object-enclosure', 'object-close', 'json-value'],
            title: braceTitle,
        });

        attachValueClickHandler(openBrace, state);
        attachValueClickHandler(closeBrace, state);

        attachBraceMatchRolloverHandlers(openBrace, closeBrace);

        container.appendChild(openBrace);

        if (memberCount > 0) {
            container.appendChild(body);
        }

        container.appendChild(closeBrace);

        return container;
    }

    /**
     * @param {Object} obj
     * @param {EncodingState} state
     * @returns {HTMLElement}
     */
    function encodeValue(obj, state)
    {
        if (isScalar(obj)) {
            return encodeScalarValue(obj, state, true);
        }

        if (typeof obj !== 'object') {
            return null;
        }

        return (obj instanceof Array)
            ? encodeArray(obj, state)
            : encodeObject(obj, state)
        ;
    }

    /**
     * @param obj
     * @param {EncodingOptions?} options
     * @returns {EncodingResult}
     */
    PrettyJSON.elementify = function(obj, options)
    {
        if (!isEncodable(obj)) {
            throw new Error('Object of type "' + (typeof obj) + '" cannot be represented as JSON');
        }

        var state = createStateObject(options || {});

        beginLine(state);
        state.rootElement.appendChild(encodeValue(obj, state));

        return state.toPublicInterface();
    };

    /**
     * @param obj
     * @param {EncodingOptions?} options
     * @returns {string}
     */
    PrettyJSON.stringify = function(obj, options)
    {
        return PrettyJSON.elementify(obj, options).outerHTML;
    };

    JSON.prettify = PrettyJSON.elementify;
}());
