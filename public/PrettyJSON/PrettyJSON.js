var PrettyJSON = {};

(function() {
    'use strict';

    function attachValueClickHandler(wrapper, state, path)
    {
        wrapper.addEventListener('click', function(e) {
            state.triggerEvent('value-click', e, path);
        });
    }

    function attachBraceMatchRollover(openBrace, closeBrace)
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

    function addFoldControl(target)
    {
        var wrapper = document.createElement('span');
        wrapper.classList.add('fold-control');

        return target.appendChild(wrapper);
    }

    function addPadding(target, count)
    {
        target.appendChild(document.createTextNode('\n'));

        var i, result = '';

        for (i = 0; i < count; i++) {
            result += ' ';
        }

        var foldCtl = addFoldControl(target);

        target.appendChild(document.createTextNode(result));

        return foldCtl;
    }

    function extractLinks(str)
    {
        var match, anchor, parts = [], p = 0,
            urlExpr = /\bhttps?:\/\/[^\/]+\/\S*/g;

        while (match = urlExpr.exec(str)) {
            if (p < match.index) {
                parts.push(document.createTextNode(str.slice(p, match.index)));
            }
            p = match.index + match[0].length;

            anchor = document.createElement('a');
            anchor.href = match[0];
            anchor.target = '_blank';
            anchor.appendChild(document.createTextNode(JSON.stringify(match[0]).slice(1, -1)));
            parts.push(anchor);
        }

        if (parts.length) {
            if (p < str.length - 1) {
                parts.push(document.createTextNode(str.slice(p)));
            }

            return parts;
        }
    }

    function elementifyArray(arr, state, indent, basePath)
    {
        var i, l, containerElement, member, wrapper, elementPath;

        containerElement = document.createElement('span');
        containerElement.classList.add('object-body');

        for (i = 0, l = arr.length; i < l; i++) {
            var foldCtl = addPadding(containerElement, indent);

            elementPath = basePath.slice();
            elementPath.push([i]);

            member = document.createElement('span');
            member.classList.add('object-member');

            toElement(arr[i], state, member, indent, elementPath, foldCtl);

            wrapper = document.createElement('span');
            wrapper.classList.add('object-delimiter', 'json-grammar');
            wrapper.appendChild(document.createTextNode(','));
            member.appendChild(wrapper);

            containerElement.appendChild(member);
        }

        if (containerElement.lastChild) {
            containerElement.lastChild.removeChild(containerElement.lastChild.lastChild);
        }

        return containerElement;
    }

    function elementifyObject(obj, state, indent, basePath)
    {
        var key, containerElement, member, wrapper, elementPath;

        containerElement = document.createElement('span');
        containerElement.classList.add('object-body');

        for (key in obj) {
            if (obj.hasOwnProperty(key) && typeof obj[key] !== 'function') {
                var foldCtl = addPadding(containerElement, indent);

                elementPath = basePath.slice();
                elementPath.push(key);

                member = document.createElement('span');
                member.classList.add('object-member');

                wrapper = document.createElement('span');
                wrapper.classList.add('object-member-key');
                toElement(String(key), state, wrapper, indent);
                member.appendChild(wrapper);

                wrapper = document.createElement('span');
                wrapper.classList.add('object-delimiter', 'json-grammar');
                wrapper.appendChild(document.createTextNode(' : '));
                member.appendChild(wrapper);

                wrapper = document.createElement('span');
                wrapper.classList.add('object-member-value');
                toElement(obj[key], state, wrapper, indent, elementPath, foldCtl);
                member.appendChild(wrapper);

                wrapper = document.createElement('span');
                wrapper.classList.add('object-delimiter', 'json-grammar');
                wrapper.appendChild(document.createTextNode(','));
                member.appendChild(wrapper);

                containerElement.appendChild(member);
            }
        }

        if (containerElement.lastChild) {
            containerElement.lastChild.removeChild(containerElement.lastChild.lastChild);
        }

        return containerElement;
    }

    function createStateObject(containerElement)
    {
        var eventHandlers = {};

        return {
            rootElement: containerElement,
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
        };
    }

    function attachFoldControlClickEventListener(foldCtl, objectBody) {
        foldCtl.classList.add('unfolded');

        foldCtl.addEventListener('click', function() {
            if (foldCtl.classList.contains('unfolded')) {
                foldCtl.classList.remove('unfolded');
                foldCtl.classList.add('folded');
                objectBody.classList.add('folded');
            } else {
                foldCtl.classList.remove('folded');
                foldCtl.classList.add('unfolded');
                objectBody.classList.remove('folded');
            }
        });
    }

    function toElement(obj, state, containerElement, indent, path, foldCtl)
    {
        var wrapper, openBrace, closeBrace, parts, i, l,
            isValue = Boolean(path);

        if (!containerElement) {
            containerElement = document.createElement('div');
            containerElement.classList.add('pretty-json-container');
            foldCtl = addFoldControl(containerElement);

            state = createStateObject(containerElement);
        }

        indent = indent || 0;
        path = path || [];

        switch (typeof obj) {
            case 'string':
                if (parts = extractLinks(obj)) {
                    wrapper = document.createElement('span');
                    wrapper.classList.add('value-string');
                    wrapper.title = 'String';
                    if (isValue) {
                        wrapper.classList.add('json-value');
                        attachValueClickHandler(wrapper, state, path);
                    }

                    wrapper.appendChild(document.createTextNode('"'));
                    for (i = 0, l = parts.length; i < l; i++) {
                        wrapper.appendChild(parts[i]);
                    }
                    wrapper.appendChild(document.createTextNode('"'));

                    containerElement.appendChild(wrapper);
                    break;
                }

            case 'number':
            case 'boolean':
                wrapper = document.createElement('span');
                wrapper.classList.add('value-' + (typeof obj));
                wrapper.title = (typeof obj).slice(0, 1).toUpperCase() + (typeof obj).slice(1);
                if (isValue) {
                    wrapper.classList.add('json-value');
                    attachValueClickHandler(wrapper, state, path);
                }

                wrapper.appendChild(document.createTextNode(JSON.stringify(obj)));

                containerElement.appendChild(wrapper);
                break;

            case 'object':
                if (obj === null) {
                    wrapper = document.createElement('span');
                    wrapper.classList.add('value-null');
                    wrapper.title = 'Null';
                    if (isValue) {
                        wrapper.classList.add('json-value');
                        attachValueClickHandler(wrapper, state, path);
                    }

                    wrapper.appendChild(document.createTextNode(JSON.stringify(obj)));

                    containerElement.appendChild(wrapper);
                } else if (obj instanceof Array) {
                    openBrace = document.createElement('span');
                    openBrace.classList.add('array-enclosure', 'json-grammar');
                    openBrace.appendChild(document.createTextNode('['));
                    closeBrace = document.createElement('span');
                    closeBrace.classList.add('array-enclosure', 'json-grammar');
                    openBrace.title = closeBrace.title = 'Array (' + obj.length + ' element' + (obj.length === 1 ? '' : 's') + ')';

                    if (isValue) {
                        openBrace.classList.add('json-value');
                        attachValueClickHandler(openBrace, state, path);
                        closeBrace.classList.add('json-value');
                        attachValueClickHandler(closeBrace, state, path);
                    }

                    attachBraceMatchRollover(openBrace, closeBrace);

                    containerElement.appendChild(openBrace);

                    if (obj.length) {
                        wrapper = elementifyArray(obj, state, indent + 4, path);
                        attachFoldControlClickEventListener(foldCtl, wrapper);
                        addPadding(wrapper, indent);
                        containerElement.appendChild(wrapper);
                    }

                    closeBrace.appendChild(document.createTextNode(']'));
                    containerElement.appendChild(closeBrace);
                } else {
                    openBrace = document.createElement('span');
                    openBrace.classList.add('object-enclosure');
                    openBrace.appendChild(document.createTextNode('{'));
                    closeBrace = document.createElement('span');
                    closeBrace.classList.add('object-enclosure');

                    if (isValue) {
                        openBrace.classList.add('json-value');
                        attachValueClickHandler(openBrace, state, path);
                        closeBrace.classList.add('json-value');
                        attachValueClickHandler(closeBrace, state, path);
                    }

                    wrapper = elementifyObject(obj, state, indent + 4, path);

                    openBrace.title = closeBrace.title = 'Object (' + wrapper.childNodes.length + ' member' + (wrapper.childNodes.length === 1 ? '' : 's') + ')';
                    attachBraceMatchRollover(openBrace, closeBrace);

                    containerElement.appendChild(openBrace);

                    if (wrapper.childNodes.length) {
                        attachFoldControlClickEventListener(foldCtl, wrapper);
                        addPadding(wrapper, indent);
                        containerElement.appendChild(wrapper);
                        foldCtl.classList.add('foldable', 'unfolded');
                    }

                    closeBrace.appendChild(document.createTextNode('}'));
                    containerElement.appendChild(closeBrace);
                }
                break;
        }

        return {
            rootElement: state.rootElement,
            addEventListener: state.addEventListener,
        };
    }

    PrettyJSON.elementify = function(obj)
    {
        return toElement(obj);
    };

    PrettyJSON.stringify = function(obj)
    {
        return toElement(obj).outerHTML;
    };

    JSON.prettify = PrettyJSON.elementify;
}());
