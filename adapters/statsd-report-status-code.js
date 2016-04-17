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
        var resource = requestOptions.resource;
        var statsEmitter = self.options.statsEmitter;
        if (error) {
            // report 500 for client errors, e.g. ETIMEDOUT, ESOCKETTIMEDOUT
            statsEmitter.emit('statusCode', resource, 500);
            return handleResponse(error);
        }
        statsEmitter.emit('statusCode', resource, response.statusCode);
        handleResponse(null, response);
    }
};
