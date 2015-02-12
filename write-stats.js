module.exports = writeStats;

function writeStats(emitter, options) {
    var clientName = options.clientName;
    var statsd = options.statsd;

    emitter.on('makeRequest', onMakeRequest);
    emitter.on('requestTime', onRequestTime);
    emitter.on('statusCode', onStatusCode);
    emitter.on('totalTime', onTotalTime);

    function onMakeRequest(resource) {
        statsd.increment([
            'typed-request-client',
            clientName,
            resource,
            'request'
        ].join('.'));
    }

    function onRequestTime(resource, delta) {
        statsd.timing([
            'typed-request-client',
            clientName,
            resource,
            'request-time'
        ].join('.'), delta);
    }

    function onStatusCode(resource, statusCode) {
        statsd.increment([
            'typed-request-client',
            clientName,
            resource,
            'statusCode',
            statusCode
        ].join('.'));
    }

    function onTotalTime(resource, delta) {
        statsd.timing([
            'typed-request-client',
            clientName,
            resource,
            'total-time'
        ].join('.'), delta);
    }
}
