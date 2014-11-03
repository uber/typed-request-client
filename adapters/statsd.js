var EventEmitter = require('events').EventEmitter;
var errors = require('../errors.js');
var writeStats = require('../write-stats.js');

module.exports = StatsdRequestHandler;
function StatsdRequestHandler(handleRequest, options) {
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
    return handleRequest;
}
