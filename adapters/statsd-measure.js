module.exports = StatsdMeasureClient;
function StatsdMeasureClient(requestHandler, options, metricName) {
    if (!(this instanceof StatsdMeasureClient)) {
        return new StatsdMeasureClient(requestHandler, options, metricName);
    }
    this.requestHandler = requestHandler;
    this.metricName = metricName;
    this.now = options.now || Date.now;
    // To lazy-bind statsEmitter, not necessarily available at time of
    // construction since it is introduced by another layer.
    this.options = options;
}

StatsdMeasureClient.prototype.request =
function handleMeasuringRequest(
    request,
    requestOptions,
    handleMeasuredResponse
) {
    var self = this;
    var resource = requestOptions.resource;
    var begin = self.now();
    self.requestHandler.request(request, requestOptions, handleResponse);
    function handleResponse(error, response) {
        // TODO Note that this measures the response time regardless of
        // whether there was an error.
        // Error times should probably not be measured.
        var end = self.now();
        var duration = end - begin;
        self.options.statsEmitter.emit(self.metricName, resource, duration);

        if (error) {
            return handleMeasuredResponse(error);
        }
        handleMeasuredResponse(null, response);
    }
};
