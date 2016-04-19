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
        statsEmitter.emit('requestResult', resource, 'request-all');
        if (error) {
            statsEmitter.emit('requestResult', resource,
                'request-failed.client-error', error.code || 'unknown');
            return handleResponse(error);
        }
        statsEmitter.emit('statusCode', resource, response.statusCode);
        if (response.statusCode >= 400 && response.statusCode <= 599) {
            statsEmitter.emit('requestResult', resource,
                'request-failed.server-error', response.statusCode);
        }
        handleResponse(null, response);
    }
};
