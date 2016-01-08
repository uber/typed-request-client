'use strict';

var globalRequest = require('request');
var Prober = require('airlock');
var xtend = require('xtend');
var errors = require('../errors.js');

module.exports = ProbingRequestHandler;
function ProbingRequestHandler(requestHandler, options) {
    if (!(this instanceof ProbingRequestHandler)) {
        return new ProbingRequestHandler(requestHandler, options);
    }

    if (typeof options.clientName !== 'string') {
        throw errors.MissingClientName({
            optionsStr: JSON.stringify(options)
        });
    }

    this.prober = options.prober = Prober({
        enabled: options.proberEnabled === false ? false : true,
        title: 'typed-request-client.' + options.clientName,
        statsd: options.statsd
    });
    // TODO consider moving this one line into a separate layer.
    options.request = options.request || globalRequest;
    this.requestHandler = requestHandler;
    this.options = options;
}

ProbingRequestHandler.prototype.request =
function handleProbingRequest(request, opts, cb) {
    opts = xtend(opts, {request: this.options.request});
    var thunk = this.requestHandler.request.bind(
        this.requestHandler,
        request,
        opts
    );
    this.prober.probe(thunk, cb);
};
