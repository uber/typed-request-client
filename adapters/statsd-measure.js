module.exports = StatsdMeasureClient;
function StatsdMeasureClient(client, options, metricName) {
    var now = options.now || Date.now;
    return responseTimeMeasuringClient;
    function responseTimeMeasuringClient(treq, opts, cb) {
        var resource = opts.resource;
        var begin = now();
        client(treq, opts, onResponse);
        function onResponse(err, tres) {
            // TODO Note that this measures the response time regardless of
            // whether there was an error.
            // Error times should probably not be measured.
            var end = now();
            var duration = end - begin;
            var statsEmitter = options.statsEmitter;
            statsEmitter.emit(metricName, resource, duration);

            if (err) {
                return cb(err);
            }
            cb(null, tres);
        }
    }
}
