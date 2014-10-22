var globalRequest = require('request');
var Prober = require('airlock');
var EventEmitter = require('events').EventEmitter;

var validateShape = require('./validate-shape.js');
var makeTypedRequest = require('./make-typed-request.js');
var writeStats = require('./write-stats.js');
var errors = require('./errors.js');

module.exports = TypedRequestClient;

function TypedRequestClient(options) {
    if (!options) {
        throw errors.MissingOptions();
    }
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

    var now = options.now || Date.now;

    var statsEmitter = new EventEmitter();
    writeStats(statsEmitter, {
        clientName: options.clientName,
        statsd: options.statsd
    });

    var reqOpts = {
        prober: Prober({
            enabled: true,
            title: 'typed-request-client',
            statsd: options.statsd
        }),
        request: options.request || globalRequest
    };

    return typedRequestClient;

    function typedRequestClient(treq, opts, cb) {
        var requestSchema = opts.requestSchema;
        var responseSchema = opts.responseSchema;
        var resource = opts.resource;

        var beginRequest = now();
        statsEmitter.emit('makeRequest', resource);

        var result = validateShape(treq, requestSchema);
        if (result.type === 'error') {
            result.error.treq = treq;
            result.error.schema = requestSchema;

            // TODO make this a better error.
            return cb(result.error);
        }

        var beginProbe = now();
        probedRequest(result.ok, reqOpts, onResponse);

        function onResponse(err, tres) {
            statsEmitter.emit('requestTime',
                resource, now() - beginProbe);

            if (err) {
                // TODO make this a better error.
                return cb(err);
            }

            statsEmitter.emit('statusCode',
                resource, tres.statusCode);

            var result = validateShape(tres, responseSchema);

            statsEmitter.emit('totalTime',
                resource, now() - beginRequest);

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

function probedRequest(treq, opts, cb) {
    var prober = opts.prober;

    var thunk = makeTypedRequest.bind(null, treq, opts);
    prober.probe(thunk, cb);
}
