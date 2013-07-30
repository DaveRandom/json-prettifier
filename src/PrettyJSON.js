var PrettyJSON = {};

(function() {
    "use strict";

    var elementifyArray, elementifyObject, toElement;

    function addClass(el)
    {
        var i, l,
            classNames = el.className.replace(/^\s+|\s+$/g, '').split(/\s+/);

        for (i = 1, l = arguments.length; i < l; i++) {
            if (classNames.indexOf(arguments[i]) < 0) {
                classNames.push(arguments[i]);
            }
        }

        el.className = classNames.join(' ');
    }

    function removeClass(el, className)
    {
        var i, l, index,
            classNames = el.className.replace(/^\s+|\s+$/g, '').split(/\s+/);

        for (i = 1, l = arguments.length; i < l; i++) {
            index = classNames.indexOf(arguments[i]);
            if (index >= 0) {
                classNames.splice(index, 1);
            }
        }

        el.className = classNames.join(' ');
    }

    function attachBraceMatchRollover(openBrace, closeBrace)
    {
        var mouseOver = function() {
            addClass(openBrace, 'enclosure-active');
            addClass(closeBrace, 'enclosure-active');
        },
        mouseOut = function() {
            removeClass(openBrace, 'enclosure-active');
            removeClass(closeBrace, 'enclosure-active');
        };

        openBrace.addEventListener('mouseover', mouseOver);
        openBrace.addEventListener('mouseout', mouseOut);
        closeBrace.addEventListener('mouseover', mouseOver);
        closeBrace.addEventListener('mouseout', mouseOut);
    }

    elementifyArray = function(arr)
    {
        var i, l, container, member, wrapper;

        container = document.createElement('div');
        container.className = 'object-body';

        for (i = 0, l = arr.length; i < l; i++) {
            member = document.createElement('div');
            member.className = 'object-member';
            toElement(arr[i], member);
            container.appendChild(member);
            
            wrapper = document.createElement('span');
            wrapper.className = 'object-delimiter json-grammar';
            wrapper.appendChild(document.createTextNode(','));
            member.appendChild(wrapper);
        }

        container.lastChild.removeChild(container.lastChild.lastChild);

        return container;
    };

    elementifyObject = function(obj)
    {
        var key, container, member, wrapper;

        container = document.createElement('div');
        container.className = 'object-body';

        for (key in obj) {
            if (obj.hasOwnProperty(key) && typeof obj[key] !== 'function') {
                member = document.createElement('div');
                member.className = 'object-member';

                wrapper = document.createElement('span');
                wrapper.className = 'object-member-key';
                toElement(String(key), wrapper);
                member.appendChild(wrapper);

                wrapper = document.createElement('span');
                wrapper.className = 'object-delimiter json-grammar';
                wrapper.appendChild(document.createTextNode(' : '));
                member.appendChild(wrapper);

                wrapper = document.createElement('span');
                wrapper.className = 'object-member-value';
                toElement(obj[key], wrapper);
                member.appendChild(wrapper);

                wrapper = document.createElement('span');
                wrapper.className = 'object-delimiter json-grammar';
                wrapper.appendChild(document.createTextNode(','));
                member.appendChild(wrapper);

                container.appendChild(member);
            }
        }

        container.lastChild.removeChild(container.lastChild.lastChild);

        return container;
    };

    toElement = function(obj, container)
    {
        var wrapper, anchor, openBrace, closeBrace;

        if (!container) {
            container = document.createElement('div');
            container.className = "pretty-json-container";
        }

        switch (typeof obj) {
            case 'string':
                if (obj.match(/^https?:\/\/[^\/]+\/\S*$/)) {
                    wrapper = document.createElement('span');
                    wrapper.className = 'value-string';
                    wrapper.title = 'String';
                    wrapper.appendChild(document.createTextNode('"'));
                    anchor = document.createElement('a');
                    anchor.href = obj;
                    anchor.target = '_blank';
                    anchor.appendChild(document.createTextNode(JSON.stringify(obj).slice(1, -1)));
                    wrapper.appendChild(anchor);
                    wrapper.appendChild(document.createTextNode('"'));

                    container.appendChild(wrapper);
                    break;
                }

            case 'number': case 'boolean':
                wrapper = document.createElement('span');
                wrapper.className = 'value-' + (typeof obj);
                wrapper.title = (typeof obj).slice(0, 1).toUpperCase() + (typeof obj).slice(1);
                wrapper.appendChild(document.createTextNode(JSON.stringify(obj)));

                container.appendChild(wrapper);
                break;

            case 'object':
                if (obj === null) {
                    wrapper = document.createElement('span');
                    wrapper.className = 'value-null';
                    wrapper.title = 'Null';
                    wrapper.appendChild(document.createTextNode(JSON.stringify(obj)));

                    container.appendChild(wrapper);
                } else if (obj instanceof Array) {
                    openBrace = document.createElement('span');
                    openBrace.className = 'array-enclosure json-grammar';
                    openBrace.appendChild(document.createTextNode('['));
                    container.appendChild(openBrace);

                    container.appendChild(elementifyArray(obj));

                    closeBrace = document.createElement('span');
                    closeBrace.className = 'array-enclosure json-grammar';
                    closeBrace.appendChild(document.createTextNode(']'));
                    container.appendChild(closeBrace);

                    attachBraceMatchRollover(openBrace, closeBrace);
                } else {
                    openBrace = document.createElement('span');
                    openBrace.className = 'object-enclosure';
                    openBrace.appendChild(document.createTextNode('{'));
                    container.appendChild(openBrace);

                    container.appendChild(elementifyObject(obj));

                    closeBrace = document.createElement('span');
                    closeBrace.className = 'object-enclosure';
                    closeBrace.appendChild(document.createTextNode('}'));
                    container.appendChild(closeBrace);

                    attachBraceMatchRollover(openBrace, closeBrace);
                }
                break;
        }

        return container;
    };

    PrettyJSON.elementify = function(obj)
    {
        return toElement(obj);
    };

    PrettyJSON.stringify = function(obj)
    {
        return toElement(obj).outerHTML;
    };
}());
