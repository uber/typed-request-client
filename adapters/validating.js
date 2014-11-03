var validateShape = require('../validate-shape.js');

module.exports = ValidatingRequestHandler;
function ValidatingRequestHandler(requestHandler, options) {
    return {request: handleValidatingRequest};

    function handleValidatingRequest(treq, requestOptions, handleResponse) {
        var requestSchema = requestOptions.requestSchema;
        var responseSchema = requestOptions.responseSchema;

        var result = validateShape(treq, requestSchema);
        if (result.type === 'error') {
            result.error.treq = treq;
            result.error.schema = requestSchema;

            // TODO make this a better error.
            return handleResponse(result.error);
        }

        requestHandler.request(result.ok, requestOptions, onResponse);

        function onResponse(error, response) {
            if (error) {
                return handleResponse(error);
            }
            var result = validateShape(response, responseSchema);

            if (result.type === 'error') {
                result.error.tres = response;
                result.error.schema = responseSchema;

                // TODO make this a better error.
                return handleResponse(result.error);
            }

            handleResponse(null, result.ok);
        }
    }
}
