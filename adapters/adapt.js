var enchain = require('enchain');

module.exports = enchain({
    statsd: require('./statsd.js'),
    statsdMeasure: require('./statsd-measure.js'),
    statsdReportStatusCode: require('./statsd-report-status-code.js'),
    statsdReportRequestMade:
        require('./statsd-report-request-made.js'),
    validating: require('./validating.js'),
    probing: require('./probing.js')
});
