var errors = require('./errors.js');
var adapt = require('./adapt.js');

module.exports = TypedRequestClient;

function TypedRequestClient(options) {
    if (!options) {
        throw errors.MissingOptions();
    }

    return adapt()
        .probing(options)
        .statsdMeasure(options, 'requestTime')
        .statsdReportStatusCode(options)
        .validating(options)
        .statsdReportRequestMade(options)
        .statsdMeasure(options, 'totalTime')
        .statsd(options)
        .valueOf().request;
}
