module.exports = {
    statsd: require('./adapters/statsd.js'),
    statsdMeasure: require('./adapters/statsd-measure.js'),
    statsdReportStatusCode: require('./adapters/statsd-report-status-code.js'),
    statsdReportRequestMade:
        require('./adapters/statsd-report-request-made.js'),
    validating: require('./adapters/validating.js'),
    probing: require('./adapters/probing.js')
};
