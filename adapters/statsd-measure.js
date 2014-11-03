module.exports = StatsdMeasureClient;
function StatsdMeasureClient(requestHandler, options, metricName) {
    var now = options.now || Date.now;
    return {request: handleMeasuringRequest};
    function handleMeasuringRequest(
        request,
        requestOptions,
        handleMeasuredResponse
    ) {
        var resource = requestOptions.resource;
        var begin = now();
        requestHandler.request(request, requestOptions, handleResponse);
        function handleResponse(error, response) {
            // TODO Note that this measures the response time regardless of
            // whether there was an error.
            // Error times should probably not be measured.
            var end = now();
            var duration = end - begin;
            var statsEmitter = options.statsEmitter;
            statsEmitter.emit(metricName, resource, duration);

            if (error) {
                return handleMeasuredResponse(error);
            }
            handleMeasuredResponse(null, response);
        }
    }
}
