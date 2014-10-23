var globalRequest = require('request');
var Prober = require('airlock');
var EventEmitter = require('events').EventEmitter;
var enchain = require('enchain');

var validateShape = require('./validate-shape.js');
var makeTypedRequest = require('./make-typed-request.js');
var writeStats = require('./write-stats.js');
var errors = require('./errors.js');

module.exports = TypedRequestClient;

var chain = enchain({
    statsd: StatsdClient,
    statsdMeasure: StatsdMeasureClient,
    statsdReportStatusCode: StatsdReportStatusCodeClient,
    statsdReportRequestMade: StatsdReportRequestMadeClient,
    validating: ValidatingClient,
    probing: ProbingClient
});

function TypedRequestClient(options) {
    if (!options) {
        throw errors.MissingOptions();
    }

    return chain(makeTypedRequest)
        .probing(options)
        .statsdMeasure(options, 'requestTime')
        .statsdReportStatusCode(options)
        .validating(options)
        .statsdMeasure(options, 'totalTime')
        .statsd(options)
        .valueOf();
}

function StatsdClient(client, options) {
    if (typeof options.clientName !== 'string') {
        throw errors.MissingClientName({
            optionsStr: JSON.stringify(options)
        });
    }
    if (typeof options.statsd !== 'object') {
        throw errors.MissingStatsd({
            optionsStr: JSON.stringify(options)
        });
    }

    var statsEmitter = new EventEmitter();
    options.statsEmitter = statsEmitter;
    writeStats(statsEmitter, {
        clientName: options.clientName,
        statsd: options.statsd
    });
    return client;
}

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

function StatsdReportRequestMadeClient(client, options) {
    return statsdRequestMadeReportingClient;
    function statsdRequestMadeReportingClient(treq, opts, cb) {
        var resource = opts.resource;
        var statsEmitter = options.statsEmitter;
        statsEmitter.emit('makeRequest', resource);
        client(treq, opts, cb);
    }
}

function ValidatingClient(client, options) {
    return validatingClient;

    function validatingClient(treq, opts, cb) {
        var requestSchema = opts.requestSchema;
        var responseSchema = opts.responseSchema;

        var result = validateShape(treq, requestSchema);
        if (result.type === 'error') {
            result.error.treq = treq;
            result.error.schema = requestSchema;

            // TODO make this a better error.
            return cb(result.error);
        }

        client(result.ok, opts, onResponse);

        function onResponse(err, tres) {
            if (err) {
                return cb(err);
            }
            var result = validateShape(tres, responseSchema);

            if (result.type === 'error') {
                result.error.tres = tres;
                result.error.schema = responseSchema;

                // TODO make this a better error.
                return cb(result.error);
            }

            cb(null, result.ok);
        }
    }
}

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
