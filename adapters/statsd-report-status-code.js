// Variation on what exists in the typed-request package
module.exports = StatsdReportStatusCodeHandler;
function StatsdReportStatusCodeHandler(requestHandler, options) {
    return {request: handleReportingRequest};
    function handleReportingRequest(request, requestOptions, handleResponse) {
        requestHandler.request(request, requestOptions, onResponse);
        function onResponse(error, response) {
            if (error) {
                return handleResponse(error);
            }
            var resource = requestOptions.resource;
            var statsEmitter = options.statsEmitter;
            statsEmitter.emit('statusCode', resource, response.statusCode);
            handleResponse(null, response);
        }
    }
}
