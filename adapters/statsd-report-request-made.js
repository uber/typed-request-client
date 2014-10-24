module.exports = StatsdReportRequestMadeClient;
function StatsdReportRequestMadeClient(client, options) {
    return statsdRequestMadeReportingClient;
    function statsdRequestMadeReportingClient(treq, opts, cb) {
        var resource = opts.resource;
        var statsEmitter = options.statsEmitter;
        statsEmitter.emit('makeRequest', resource);
        client(treq, opts, cb);
    }
}
