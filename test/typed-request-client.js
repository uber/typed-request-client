var test = require('tape');

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

test('can make request', function t(assert) {
    var request = TypedRequestClient({
        clientName: 'demo',
        statsd: fakeStatsd,
        request: function r(opts, cb) {
            assert.equal(opts.url, 'http://localhost:8000/');
            assert.equal(opts.method, 'GET');
            assert.deepEqual(opts.headers, {});
            assert.equal(opts.timeout, 30000);
            assert.deepEqual(opts.json, {
                'foo': 'bar'
            });

            assert.deepEqual(Object.keys(opts), [
                'url', 'method', 'headers', 'timeout', 'json'
            ]);

            cb(null, {
                statusCode: 200,
                httpVersion: '1.1',
                headers: {},
                body: {}
            });
        }
    });

    var treq = {
        url: 'http://localhost:8000/',
        method: 'GET',
        headers: {},
        body: {
            'foo': 'bar'
        }
    };

    request(treq, {
        requestSchema: requestSchema,
        responseSchema: responseSchema,
        resource: '.read'
    }, onResponse);

    function onResponse(err, tres) {
        assert.ifError(err);

        assert.equal(tres.statusCode, 200);
        assert.equal(tres.httpVersion, '1.1');
        assert.deepEqual(tres.headers, {});
        assert.deepEqual(tres.body, {});
        assert.deepEqual(Object.keys(tres), [
            'statusCode', 'httpVersion', 'headers', 'body'
        ]);

        assert.end();
    }
});

test('request error', function t(assert) {
    var request = TypedRequestClient({
        clientName: 'demo',
        statsd: fakeStatsd,
        request: function r(opts, cb) {
            assert.fail('request called');
        }
    });

    var treq = {
        url: 'http://localhost:8000/',
        method: 'GET',
        headers: {}
    };

    request(treq, {
        requestSchema: requestSchema,
        responseSchema: responseSchema,
        resource: '.read'
    }, onResponse);

    function onResponse(err, tres) {
        assert.ok(err);

        assert.equal(err.message, 'Required');
        assert.equal(err.attribute, 'body');

        assert.end();
    }
});

test('io error', function t(assert) {
    var request = TypedRequestClient({
        clientName: 'demo',
        statsd: fakeStatsd,
        request: function r(opts, cb) {
            cb(new Error('ECONNRESET'));
        }
    });

    var treq = {
        url: 'http://localhost:8000/',
        method: 'GET',
        headers: {},
        body: {
            'foo': 'bar'
        }
    };

    request(treq, {
        requestSchema: requestSchema,
        responseSchema: responseSchema,
        resource: '.read'
    }, onResponse);

    function onResponse(err, tres) {
        assert.ok(err);
        assert.equal(err.message, 'ECONNRESET');

        assert.end();
    }
});

test('response error', function t(assert) {
    var request = TypedRequestClient({
        clientName: 'demo',
        statsd: fakeStatsd,
        request: function r(opts, cb) {
            cb(null, {
                statusCode: 200,
                httpVersion: '1.1',
                headers: {}
            });
        }
    });

    var treq = {
        url: 'http://localhost:8000/',
        method: 'GET',
        headers: {},
        body: {
            'foo': 'bar'
        }
    };

    request(treq, {
        requestSchema: requestSchema,
        responseSchema: responseSchema,
        resource: '.read'
    }, onResponse);

    function onResponse(err, tres) {
        assert.ok(err);

        assert.equal(err.message, 'Required');
        assert.equal(err.attribute, 'body');

        assert.end();
    }
});
