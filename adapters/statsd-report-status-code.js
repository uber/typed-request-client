module.exports = StatsdReportStatusCodeClient;
function StatsdReportStatusCodeClient(client, options) {
    return statsdStatusCodeReportingClient;
    function statsdStatusCodeReportingClient(treq, opts, cb) {
        client(treq, opts, onResponse);
        function onResponse(err, tres) {
            if (err) {
                return cb(err);
            }
            var resource = opts.resource;
            var statsEmitter = options.statsEmitter;
            statsEmitter.emit('statusCode', resource, tres.statusCode);
            cb(null, tres);
        }
    }
}
