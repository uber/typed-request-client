var test = require('tape');
var http = require('http');
var sendJson = require('send-data/json');

var TypedRequestClient = require('../index.js');

var fakeStatsd = {
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
    }
};

var requestSchema = {
    type: 'object',
    properties: {
        'url': { type: 'string' },
        'method': { type: 'string' },
        'headers': { type: 'object' },
        'body': {
            type: 'object',
            properties: {
                'foo': { type: 'string' }
            },
            required: ['foo']
        }
    },
    required: ['url', 'method', 'headers', 'body']
};

var responseSchema = {
    type: 'object',
    properties: {
        'statusCode': { type: 'number' },
        'httpVersion': { type: 'string' },
        'headers': { type: 'object' },
        'body': { type: 'object' }
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

        var request = TypedRequestClient({
            clientName: 'demo',
            statsd: fakeStatsd
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
            resource: '.read'
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

            server.close();
            assert.end();
        }
    });
});

test('passes 500 right through', function t(assert) {
    var server = http.createServer(function onReq(req, res) {
        sendJson(req, res, {
            statusCode: 500,
            body: { message: 'sad' }
        });
    });
    server.listen(0, function onPort() {
        var port = server.address().port;

        var request = TypedRequestClient({
            clientName: 'demo',
            statsd: fakeStatsd
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
            resource: '.read'
        }, onResponse);

        function onResponse(err, tres) {
            assert.ifError(err);

            assert.equal(tres.statusCode, 500);
            assert.equal(tres.httpVersion, '1.1');
            // assert.deepEqual(tres.headers, {});
            assert.deepEqual(tres.body, { message: 'sad' });
            assert.deepEqual(Object.keys(tres), [
                 'httpVersion', 'headers', 'statusCode', 'body'
            ]);

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

        var request = TypedRequestClient({
            clientName: 'demo',
            statsd: fakeStatsd
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
            resource: '.read'
        }, onResponse);

        function onResponse(err) {
            assert.ok(
                err.code === 'ETIMEDOUT' ||
                err.code === 'ESOCKETTIMEDOUT'
            );
            server.close();
            assert.end();
        }
    });
});
