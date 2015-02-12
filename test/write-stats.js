var EventEmitter = require('events').EventEmitter;
var test = require('tape');
var writeStats = require('../write-stats.js');

test('writes stats with dots', function t(assert) {
    assert.plan(4);

    function emitStat(eventArgs, statsd) {
        var emitter = new EventEmitter();
        var options = {
            clientName: 'myclient',
            statsd: statsd
        };
        writeStats(emitter, options);

        emitter.emit.apply(emitter, eventArgs);
    }

    function assertIncrement(eventArgs, expectedStat) {
        emitStat(eventArgs, {
            increment: function incrementIt(actual) {
                assert.equal(actual, expectedStat);
            }
        });
    }

    function assertTiming(eventArgs, expectedStat) {
        emitStat(eventArgs, {
            timing: function timeIt(actual) {
                assert.equal(actual, expectedStat);
            }
        });
    }

    var resource = 'myresource';
    assertIncrement(['makeRequest', resource],
        'typed-request-client.myclient.myresource.request');
    assertTiming(['requestTime', resource, 1],
        'typed-request-client.myclient.myresource.request-time');
    assertIncrement(['statusCode', resource, 200],
        'typed-request-client.myclient.myresource.statusCode.200');
    assertTiming(['totalTime', resource],
        'typed-request-client.myclient.myresource.total-time');
    assert.end();
});
