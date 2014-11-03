var globalRequest = require('request');
var Prober = require('airlock');

module.exports = ProbingClient;
function ProbingClient(requestHandler, options) {
    var prober = options.prober = Prober({
        enabled: true,
        title: 'typed-request-client',
        statsd: options.statsd
    });
    options.request = options.request || globalRequest;

    return {request: handleProbingRequest};

    function handleProbingRequest(request, opts, cb) {
        var thunk = requestHandler.request.bind(
            requestHandler,
            request,
            options
        );
        prober.probe(thunk, cb);
    }
}
