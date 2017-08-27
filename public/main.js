(function() {

    var saveButtonVisible = false,
        saveButton = document.createElement('button'),
        prettifyButton = document.getElementById('prettify'),
        input = document.getElementById('input'),
        output = document.getElementById('output');

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
            output.appendChild(JSON.prettify(data));

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

        e.preventDefault();
    }

    saveButton.appendChild(document.createTextNode('Save'));
    prettifyButton.addEventListener('click', prettifyInput);

    if (input.value !== '') {
        prettifyInput();
    }

}());
