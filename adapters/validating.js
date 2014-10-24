var validateShape = require('../validate-shape.js');

module.exports = ValidatingClient;
function ValidatingClient(client, options) {
    return validatingClient;

    function validatingClient(treq, opts, cb) {
        var requestSchema = opts.requestSchema;
        var responseSchema = opts.responseSchema;

        var result = validateShape(treq, requestSchema);
        if (result.type === 'error') {
            result.error.treq = treq;
            result.error.schema = requestSchema;

            // TODO make this a better error.
            return cb(result.error);
        }

        client(result.ok, opts, onResponse);

        function onResponse(err, tres) {
            if (err) {
                return cb(err);
            }
            var result = validateShape(tres, responseSchema);

            if (result.type === 'error') {
                result.error.tres = tres;
                result.error.schema = responseSchema;

                // TODO make this a better error.
                return cb(result.error);
            }

            cb(null, result.ok);
        }
    }
}
