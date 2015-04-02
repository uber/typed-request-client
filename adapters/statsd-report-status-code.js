'use strict';

// Variation on what exists in the typed-request package
module.exports = StatsdReportStatusCodeHandler;
function StatsdReportStatusCodeHandler(requestHandler, options) {
    if (!(this instanceof StatsdReportStatusCodeHandler)) {
        return new StatsdReportStatusCodeHandler(requestHandler, options);
    }
    this.requestHandler = requestHandler;
    this.options = options;
}

StatsdReportStatusCodeHandler.prototype.request =
function handleReportingRequest(request, requestOptions, handleResponse) {
    var self = this;
    self.requestHandler.request(request, requestOptions, onResponse);
    function onResponse(error, response) {
        if (error) {
            return handleResponse(error);
        }
        var resource = requestOptions.resource;
        var statsEmitter = self.options.statsEmitter;
        statsEmitter.emit('statusCode', resource, response.statusCode);
        handleResponse(null, response);
    }
};
