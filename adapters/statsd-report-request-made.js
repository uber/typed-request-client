'use strict';

module.exports = StatsdReportRequestMadeHandler;
function StatsdReportRequestMadeHandler(requestHandler, options) {
    if (!(this instanceof StatsdReportRequestMadeHandler)) {
        return new StatsdReportRequestMadeHandler(requestHandler, options);
    }
    this.requestHandler = requestHandler;
    this.options = options;
}

StatsdReportRequestMadeHandler.prototype.request =
function handleStatsdRequestMadeReportingRequest(
    request,
    requestOptions,
    handleResponse
) {
    var resource = requestOptions.resource;
    var statsEmitter = this.options.statsEmitter;
    statsEmitter.emit('makeRequest', resource);
    this.requestHandler.request(request, requestOptions, handleResponse);
};
