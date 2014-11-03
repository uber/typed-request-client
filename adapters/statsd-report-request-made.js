module.exports = StatsdReportRequestMadeHandler;
function StatsdReportRequestMadeHandler(handleRequest, options) {
    return {request: handleStatsdRequestMadeReportingRequest};
    function handleStatsdRequestMadeReportingRequest(
        request,
        requestOptions,
        handleResponse
    ) {
        var resource = requestOptions.resource;
        var statsEmitter = options.statsEmitter;
        statsEmitter.emit('makeRequest', resource);
        handleRequest.request(request, requestOptions, handleResponse);
    }
}
