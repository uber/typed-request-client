var globalRequest = require('request');
var Prober = require('airlock');

module.exports = ProbingRequestHandler;
function ProbingRequestHandler(requestHandler, options) {
    if (!(this instanceof ProbingRequestHandler)) {
        return new ProbingRequestHandler(requestHandler, options);
    }
    this.prober = options.prober = Prober({
        enabled: true,
        title: 'typed-request-client',
        statsd: options.statsd
    });
    // TODO consider moving this one line into a separate layer.
    options.request = options.request || globalRequest;
    this.requestHandler = requestHandler;
    this.options = options;
}

ProbingRequestHandler.prototype.request =
function handleProbingRequest(request, opts, cb) {
    var thunk = this.requestHandler.request.bind(
        this.requestHandler,
        request,
        this.options
    );
    this.prober.probe(thunk, cb);
};
