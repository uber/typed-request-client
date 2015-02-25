module.exports = writeStats;

function writeStats(emitter, options) {
    var clientName = options.clientName;
    var statsd = options.statsd;

    emitter.on('makeRequest', onMakeRequest);
    emitter.on('requestTime', onRequestTime);
    emitter.on('statusCode', onStatusCode);
    emitter.on('totalTime', onTotalTime);

    function sanitize(statStr) {
        return statStr.replace(/{|}/g, '');
    }

    function onMakeRequest(resource) {
        statsd.increment(sanitize('typed-request-client.' + clientName +
            '.' + resource + '.request'));
    }

    function onRequestTime(resource, delta) {
        statsd.timing(sanitize('typed-request-client.' + clientName +
            '.' + resource + '.request-time'), delta);
    }

    function onStatusCode(resource, statusCode) {
        statsd.increment(sanitize('typed-request-client.' + clientName +
            '.' + resource + '.statusCode.' + statusCode));
    }

    function onTotalTime(resource, delta) {
        statsd.timing(sanitize('typed-request-client.' + clientName +
            '.' + resource + '.total-time'), delta);
    }
}
