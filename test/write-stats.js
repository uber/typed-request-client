var EventEmitter = require('events').EventEmitter;
var test = require('tape');
var writeStats = require('../write-stats.js');

function assertIncrement(assert, testData) {
    emitStat(testData, {
        increment: function incrementIt(actual) {
            assert.equal(actual, testData.statKey);
        }
    });
}

function assertTiming(assert, testData) {
    emitStat(testData, {
        timing: function timeIt(actual) {
            assert.equal(actual, testData.statKey);
        }
    });
}

function createTestData(resource, statKeyPart) {
    return {
        makeRequest: {
            args: [resource],
            eventName: 'makeRequest',
            statKey: 'typed-request-client.myclient.' +
                (statKeyPart || resource) + '.request'
        },
        requestTime: {
            args: [resource, 1],
            eventName: 'requestTime',
            statKey: 'typed-request-client.myclient.' +
                (statKeyPart || resource) + '.request-time'
        },
        statusCode: {
            args: [resource, 200],
            eventName: 'statusCode',
            statKey: 'typed-request-client.myclient.' +
                (statKeyPart || resource) + '.statusCode.200'
        },
        totalTime: {
            args: [resource],
            eventName: 'totalTime',
            statKey: 'typed-request-client.myclient.' +
                (statKeyPart || resource) + '.total-time'
        }
    };
}

function emitStat(testData, statsd) {
    var emitter = new EventEmitter();

    writeStats(emitter, {
        clientName: 'myclient',
        statsd: statsd
    });

    testData.args.unshift(testData.eventName);

    emitter.emit.apply(emitter, testData.args);
}

test('writes stats with dots', function t(assert) {
    assert.plan(4);

    var testData = createTestData('myresource');
    assertIncrement(assert, testData.makeRequest);
    assertIncrement(assert, testData.statusCode);
    assertTiming(assert, testData.requestTime);
    assertTiming(assert, testData.totalTime);
    assert.end();
});

test('writes stats without curlies', function t(assert) {
    assert.plan(4);

    var testData = createTestData('{myresource}', 'myresource');
    assertIncrement(assert, testData.makeRequest);
    assertIncrement(assert, testData.statusCode);
    assertTiming(assert, testData.requestTime);
    assertTiming(assert, testData.totalTime);
    assert.end();
});
