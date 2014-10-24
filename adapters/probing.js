var globalRequest = require('request');
var Prober = require('airlock');

module.exports = ProbingClient;
function ProbingClient(client, options) {
    var reqOpts = {
        prober: Prober({
            enabled: true,
            title: 'typed-request-client',
            statsd: options.statsd
        }),
        request: options.request || globalRequest
    };

    return probingClient;

    function probingClient(treq, opts, cb) {
        var prober = reqOpts.prober;
        var thunk = client.bind(null, treq, reqOpts);
        prober.probe(thunk, cb);
    }
}
