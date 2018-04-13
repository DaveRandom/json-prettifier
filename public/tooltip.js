(function() {
    'use strict';

    function createTooltipElement(container, accessors)
    {
        var key, row, titleCell, valueCell,
            result = {
                container: container,
                rootElement: document.body.appendChild(document.createElement('div')),
                values: {},
            };

        result.rootElement.classList.add('value-tooltip');
        result.rootElement.addEventListener('click', function(ev) {
            ev.stopPropagation();
        });

        var table = result.rootElement.appendChild(document.createElement('table'));

        for (key in accessors) {
            if (!accessors.hasOwnProperty(key)) {
                continue;
            }

            row = table.appendChild(document.createElement('tr'));

            titleCell = row.appendChild(document.createElement('td'));
            titleCell.appendChild(document.createTextNode(accessors[key]));
            titleCell.classList.add('language-accessor-title');

            valueCell = row.appendChild(document.createElement('td'));
            valueCell.classList.add('language-accessor');

            result.values[key] = valueCell;
        }

        return result;
    }

    function computePosition(data, targetTop, targetLeft)
    {
        var containerRect = data.container.getBoundingClientRect();

        return {
            top: Math.max(Math.round(targetTop - (data.rootElement.clientHeight + 3)), 0),
            left: Math.max(
                containerRect.left,
                Math.min(
                    Math.round(targetLeft - (data.rootElement.clientWidth / 2)),
                    (containerRect.left + containerRect.width) - data.rootElement.clientWidth
                )
            ),
        };
    }

    function createTooltipManager(container, data)
    {
        var result = {
            setValue: function(key, value) {
                if (data.values.hasOwnProperty(key)) {
                    data.values[key].innerText = value;
                }
            },

            setValues: function(values) {
                values = values || {};

                for (var key in values) {
                    if (values.hasOwnProperty(key)) {
                        result.setValue(key, values[key]);
                    }
                }
            },

            show: function(targetTop, targetLeft, values) {
                result.setValues(values);

                var position = computePosition(data, targetTop, targetLeft);
                console.log(data.rootElement);

                data.rootElement.style.top = position.top + 'px';
                data.rootElement.style.left = position.left + 'px';

                data.rootElement.style.visibility = 'visible';
            },

            hide: function() {
                data.rootElement.style.visibility = 'hidden';

                data.rootElement.style.top = '0';
                data.rootElement.style.left = '0';
            },
        };

        return result;
    }

    window.JSONPrettifier = window.JSONPrettifier || {};

    window.JSONPrettifier.Tooltip = {
        create: function(container, accessors) {
            var data = createTooltipElement(container, accessors);
            var result = createTooltipManager(container, data);

            document.body.addEventListener('click', function() { result.hide(); });

            return result;
        },
    };
}());
