'use strict';

var test = require('tape');
var http = require('http');
var sendJson = require('send-data/json');
var setTimeout = require('timers').setTimeout;

var TypedRequestClient = require('../index.js');

function createFakeStatsd(assert) {
    return {
        stats: [],
        increment: function increment(key) {
            this.stats.push({
                type: 'increment',
                key: key
            });
        },
        timing: function timing(key, delta) {
            this.stats.push({
                type: 'timing',
                key: key,
                delta: delta
            });
        },
        assertStat: function assertStat(stat, times) {
            var foundTimes = 0;
            for (var i = 0; i < this.stats.length; i++) {
                if (this.stats[i].type === stat.type &&
                    this.stats[i].key === stat.key &&
                    this.stats[i].delta === stat.delta) {
                    foundTimes++;
                }
            }
            assert.equal(times, foundTimes,
                'cannot find stat of expected times');
        }
    };
}

var requestSchema = {
    type: 'object',
    properties: {
        'url': {type: 'string'},
        'method': {type: 'string'},
        'headers': {type: 'object'},
        'body': {
            type: 'object',
            properties: {
                'foo': {type: 'string'}
            },
            required: ['foo']
        }
    },
    required: ['url', 'method', 'headers', 'body']
};

var responseSchema = {
    type: 'object',
    properties: {
        'statusCode': {type: 'number'},
        'httpVersion': {type: 'string'},
        'headers': {type: 'object'},
        'body': {type: 'object'}
    },
    required: ['statusCode', 'httpVersion', 'headers', 'body']
};

test('can make http request', function t(assert) {
    var server = http.createServer(function onReq(req, res) {
        sendJson(req, res, {
            statusCode: 200,
            body: {}
        });
    });
    server.listen(0, function onPort() {
        var port = server.address().port;

        var statsd = createFakeStatsd(assert);
        var request = TypedRequestClient({
            clientName: 'demo',
            statsd: statsd
        });

        var treq = {
            url: 'http://localhost:' + port + '/',
            method: 'GET',
            headers: {},
            body: {
                'foo': 'bar'
            }
        };

        request(treq, {
            timeout: 100,
            requestSchema: requestSchema,
            responseSchema: responseSchema,
            resource: 'read',
            filterRequest: true,
            filterResponse: true,
            validateRequest: true,
            validateResponse: true
        }, onResponse);

        function onResponse(err, tres) {
            assert.ifError(err);

            assert.equal(tres.statusCode, 200);
            assert.equal(tres.httpVersion, '1.1');
            // assert.deepEqual(tres.headers, {});
            assert.deepEqual(tres.body, {});
            assert.deepEqual(Object.keys(tres), [
                'statusCode', 'httpVersion', 'headers', 'body'
            ]);

            statsd.assertStat({
                type: 'increment',
                key: 'typed-request-client.demo.read.statusCode.200'
            }, 1);
            statsd.assertStat({
                type: 'increment',
                key: 'typed-request-client.demo.read.request-all'
            }, 1);

            server.close();
            assert.end();
        }
    });
});

test('passes 500 right through', function t(assert) {
    var server = http.createServer(function onReq(req, res) {
        sendJson(req, res, {
            statusCode: 500,
            body: {message: 'sad'}
        });
    });
    server.listen(0, function onPort() {
        var port = server.address().port;

        var statsd = createFakeStatsd(assert);
        var request = TypedRequestClient({
            clientName: 'demo',
            statsd: statsd
        });

        var treq = {
            url: 'http://localhost:' + port + '/',
            method: 'GET',
            headers: {},
            body: {
                'foo': 'bar'
            }
        };

        request(treq, {
            timeout: 100,
            requestSchema: requestSchema,
            responseSchema: responseSchema,
            resource: 'read'
        }, onResponse);

        function onResponse(err, tres) {
            assert.ifError(err);

            assert.equal(tres.statusCode, 500);
            assert.equal(tres.httpVersion, '1.1');
            // assert.deepEqual(tres.headers, {});
            assert.deepEqual(tres.body, {message: 'sad'});
            assert.deepEqual(Object.keys(tres), [
                 'httpVersion', 'headers', 'statusCode', 'body'
            ]);

            statsd.assertStat({
                type: 'increment',
                key: 'typed-request-client.demo.read.statusCode.500'
            }, 1);
            statsd.assertStat({
                type: 'increment',
                key: 'typed-request-client.demo.read' +
                    '.request-failed.server-error.500'
            }, 1);
            statsd.assertStat({
                type: 'increment',
                key: 'typed-request-client.demo.read.request-all'
            }, 1);

            server.close();
            assert.end();
        }
    });
});

test('respects timeout', function t(assert) {
    var server = http.createServer(function onReq(req, res) {
        var timeout = setTimeout(function onTimeout() {
            sendJson(req, res, {
                statusCode: 200,
                body: {}
            });
        }, 300);
        timeout.unref();
    });
    server.listen(0, function onPort() {
        var port = server.address().port;

        var statsd = createFakeStatsd(assert);
        var request = TypedRequestClient({
            clientName: 'demo',
            statsd: statsd
        });

        var treq = {
            url: 'http://localhost:' + port + '/',
            method: 'GET',
            headers: {},
            body: {
                'foo': 'bar'
            }
        };

        request(treq, {
            timeout: 100,
            requestSchema: requestSchema,
            responseSchema: responseSchema,
            resource: 'read'
        }, onResponse);

        function onResponse(err) {
            assert.ok(
                err.code === 'ETIMEDOUT' ||
                err.code === 'ESOCKETTIMEDOUT'
            );
            server.close();
            statsd.assertStat({
                type: 'increment',
                key: 'typed-request-client.demo.read.request-failed.client-error.ETIMEDOUT'
            }, 1);
            statsd.assertStat({
                type: 'increment',
                key: 'typed-request-client.demo.read.request-all'
            }, 1);
            assert.end();
        }
    });
});
