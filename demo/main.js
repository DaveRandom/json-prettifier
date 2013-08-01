(function() {

    function clearContents(el)
    {
        while (el.childNodes.length) {
            el.removeChild(el.firstChild);
        }
    }

    document.getElementById('prettify').addEventListener('click', function(e) {
        var input = document.getElementById('input'),
            output = document.getElementById('output'),
            data;

        try {
            clearContents(output);
            output.classList.add('working-message');
            output.style.display = 'block';
            output.classList.remove('pretty-json');
            output.classList.remove('error-message');
            output.appendChild(document.createTextNode('Working...'));

            try {
                data = JSON.parse(input.value);
            } catch(e) {
                throw new Error('Parse Error: ' + e.message);
            }

            clearContents(output);
            output.classList.add('pretty-json');
            output.classList.remove('working-message');
            output.appendChild(JSON.prettify(data));
        } catch(e) {
            clearContents(output);
            output.classList.remove('pretty-json');
            output.classList.remove('working-message');
            output.classList.add('error-message');
            output.appendChild(document.createTextNode('Error: ' + e.message));
        }

        e.preventDefault();
    });

}());
