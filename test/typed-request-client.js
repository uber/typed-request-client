'use strict';

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
        'url': {type: 'string'},
        'method': {type: 'string'},
        'headers': {type: 'object'},
        'query': {type: 'object'},
        'body': {
            type: 'object',
            properties: {
                'foo': {type: 'string'}
            },
            required: ['foo']
        }
    },
    required: ['url', 'method', 'headers', 'body'],
    additionalProperties: false
};

var responseSchema = {
    type: 'object',
    properties: {
        'statusCode': {type: 'number'},
        'httpVersion': {type: 'string'},
        'headers': {type: 'object'},
        'body': {
            type: 'object',
            properties: {
                'test': {'type': 'string'}
            },
            additionalProperties: false
        }
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

            assert.deepEqual(Object.keys(opts).sort(), [
                'headers', 'json', 'method', 'timeout', 'transformUrlFn', 'url'
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
        resource: '.read',
        filterRequest: true,
        filterResponse: true,
        validateRequest: true,
        validateResponse: true
    }, onResponse);

    function onResponse(err, tres) {
        assert.ifError(err);

        assert.equal(tres.statusCode, 200);
        assert.equal(tres.httpVersion, '1.1');
        assert.deepEqual(tres.headers, {});
        assert.deepEqual(tres.body, {});
        assert.deepEqual(Object.keys(tres).sort(), [
            'body', 'headers', 'httpVersion', 'statusCode'
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
        resource: '.read',
        filterRequest: true,
        filterResponse: true,
        validateRequest: true,
        validateResponse: true
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
        resource: '.read',
        filterRequest: true,
        filterResponse: true,
        validateRequest: true,
        validateResponse: true
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
        resource: '.read',
        filterRequest: true,
        filterResponse: true,
        validateRequest: true,
        validateResponse: true
    }, onResponse);

    function onResponse(err, tres) {
        assert.ok(err);

        assert.equal(err.message, 'Required');
        assert.equal(err.attribute, 'body');

        assert.end();
    }
});

test('response with nonstringified query', function t(assert) {
    var treq = {
        url: 'http://localhost:8000/',
        method: 'GET',
        headers: {},
        query: {prop: ['a,b', 'c,d']},
        body: {
            'foo': 'bar'
        }
    };

    var request = TypedRequestClient({
        clientName: 'demo',
        statsd: fakeStatsd,
        request: function r(opts, cb) {
            assert.equal(opts.url, treq.url + '?prop=a,b&prop=c,d');
            cb(null, {
                statusCode: 200,
                httpVersion: '1.1',
                headers: {},
                body: {}
            });
        }
    });

    request(treq, {
        requestSchema: requestSchema,
        responseSchema: responseSchema,
        resource: '.read',
        filterRequest: true,
        filterResponse: true,
        validateRequest: true,
        validateResponse: true,
        transformUrlFn: function transform(url) {
            return url.replace(/%2C/g, ',');
        }
    }, onResponse);

    function onResponse(err, tres) {
        assert.ifError(err);
        assert.equal(tres.httpVersion, '1.1');

        assert.end();
    }
});

test('can make request without request validation', function t(assert) {
    var request = TypedRequestClient({
        clientName: 'demo',
        statsd: fakeStatsd,
        request: function r(opts, cb) {
            assert.equal(opts.url, 'http://localhost:8000/');
            assert.equal(opts.method, 'GET');
            assert.deepEqual(opts.headers, {});
            assert.equal(opts.timeout, 30000);
            assert.deepEqual(opts.json, {});

            assert.deepEqual(Object.keys(opts).sort(), [
                'headers', 'json', 'method', 'timeout', 'transformUrlFn', 'url'
            ]);

            cb(null, {
                statusCode: 200,
                httpVersion: '1.1',
                headers: {},
                body: {
                    'baz': 'filter-this'
                }
            });
        }
    });

    var treq = {
        url: 'http://localhost:8000/',
        method: 'GET',
        headers: {},
        body: {
            'moo': 'filter-this'
        }
    };

    request(treq, {
        requestSchema: requestSchema,
        responseSchema: responseSchema,
        resource: '.read',
        filterRequest: true,
        filterResponse: true,
        validateRequest: false,
        validateResponse: true
    }, onResponse);

    function onResponse(err, tres) {
        assert.ifError(err);

        assert.equal(tres.statusCode, 200);
        assert.equal(tres.httpVersion, '1.1');
        assert.deepEqual(tres.headers, {});
        assert.deepEqual(tres.body, {});
        assert.deepEqual(Object.keys(tres).sort(), [
            'body', 'headers', 'httpVersion', 'statusCode'
        ]);

        assert.end();
    }
});

test('can make request without filtering request', function t(assert) {
    var request = TypedRequestClient({
        clientName: 'demo',
        statsd: fakeStatsd,
        request: function r(opts, cb) {
            assert.equal(opts.url, 'http://localhost:8000/');
            assert.equal(opts.method, 'GET');
            assert.deepEqual(opts.headers, {});
            assert.equal(opts.timeout, 30000);
            assert.deepEqual(opts.json, {
                'foo': 'bar',
                'moo': 'dont-filter-this'
            });

            assert.deepEqual(Object.keys(opts).sort(), [
                'headers', 'json', 'method', 'timeout', 'transformUrlFn', 'url'
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
            'foo': 'bar',
            'moo': 'dont-filter-this'
        }
    };

    request(treq, {
        requestSchema: requestSchema,
        responseSchema: responseSchema,
        resource: '.read',
        filterRequest: false,
        filterResponse: true,
        validateRequest: false,
        validateResponse: true
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

test('can make request without validating response', function t(assert) {
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

            assert.deepEqual(Object.keys(opts).sort(), [
                'headers', 'json', 'method', 'timeout', 'transformUrlFn', 'url'
            ]);

            cb(null, {
                statusCode: 200,
                httpVersion: '1.1',
                headers: {},
                body: {
                    'test': {'message': 'test should be a string'},
                    'moo': 'filter-this'
                }
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
        resource: '.read',
        filterRequest: true,
        filterResponse: true,
        validateRequest: true,
        validateResponse: false
    }, onResponse);

    function onResponse(err, tres) {
        assert.ifError(err);

        assert.equal(tres.statusCode, 200);
        assert.equal(tres.httpVersion, '1.1');
        assert.deepEqual(tres.headers, {});
        assert.deepEqual(tres.body, {
            'test': {
                'message': 'test should be a string'
            }
        });
        assert.deepEqual(Object.keys(tres).sort(), [
            'body', 'headers', 'httpVersion', 'statusCode'
        ]);

        assert.end();
    }
});

test('can make request without filtering response', function t(assert) {
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

            assert.deepEqual(Object.keys(opts).sort(), [
                'headers', 'json', 'method', 'timeout', 'transformUrlFn', 'url'
            ]);

            cb(null, {
                statusCode: 200,
                httpVersion: '1.1',
                headers: {},
                body: {
                    'moo': 'invalid-property'
                }
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
        resource: '.read',
        filterRequest: true,
        filterResponse: false,
        validateRequest: true,
        validateResponse: false
    }, onResponse);

    function onResponse(err, tres) {
        assert.ifError(err);

        assert.equal(tres.statusCode, 200);
        assert.equal(tres.httpVersion, '1.1');
        assert.deepEqual(tres.headers, {});
        assert.deepEqual(tres.body, {
            'moo': 'invalid-property'
        });
        assert.deepEqual(Object.keys(tres).sort(), [
            'body', 'headers', 'httpVersion', 'statusCode'
        ]);

        assert.end();
    }
});

test('can make request with prober enabled', function t(assert) {
    fakeStatsd.stats = [];
    var request = TypedRequestClient({
        clientName: 'demo',
        statsd: fakeStatsd,
        // Prober should be enabled
        request: function r(opts, cb) {
            assert.equal(opts.url, 'http://localhost:8000/');
            assert.equal(opts.method, 'GET');
            assert.deepEqual(opts.headers, {});
            assert.equal(opts.timeout, 30000);
            assert.deepEqual(opts.json, {
                'foo': 'bar'
            });

            assert.deepEqual(Object.keys(opts).sort(), [
                'headers', 'json', 'method', 'timeout', 'transformUrlFn', 'url'
            ]);

            cb(null, {
                statusCode: 200,
                httpVersion: '1.1',
                headers: {},
                body: {
                    'moo': 'invalid-property'
                }
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
        resource: '.read',
        filterRequest: true,
        filterResponse: false,
        validateRequest: true,
        validateResponse: false
    }, onResponse);

    function onResponse(err, tres) {
        assert.ifError(err);

        assert.equal(tres.statusCode, 200);
        assert.equal(tres.httpVersion, '1.1');
        assert.deepEqual(tres.headers, {});
        assert.deepEqual(tres.body, {
            'moo': 'invalid-property'
        });
        assert.deepEqual(Object.keys(tres).sort(), [
            'body', 'headers', 'httpVersion', 'statusCode'
        ]);
        var statsed = false;
        fakeStatsd.stats.forEach(function(stat) {
            if (stat.key.indexOf('prober') !== -1) {
                statsed = true;
            }
        });
        assert.ok(statsed, 'Prober fired');

        assert.end();
    }
});

test('can make request without prober enabled', function t(assert) {
    fakeStatsd.stats = [];
    var request = TypedRequestClient({
        clientName: 'demo',
        statsd: fakeStatsd,
        proberEnabled: false,
        request: function r(opts, cb) {
            assert.equal(opts.url, 'http://localhost:8000/');
            assert.equal(opts.method, 'GET');
            assert.deepEqual(opts.headers, {});
            assert.equal(opts.timeout, 30000);
            assert.deepEqual(opts.json, {
                'foo': 'bar'
            });

            assert.deepEqual(Object.keys(opts).sort(), [
                'headers', 'json', 'method', 'timeout', 'transformUrlFn', 'url'
            ]);

            cb(null, {
                statusCode: 200,
                httpVersion: '1.1',
                headers: {},
                body: {
                    'moo': 'invalid-property'
                }
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
        resource: '.read',
        filterRequest: true,
        filterResponse: false,
        validateRequest: true,
        validateResponse: false
    }, onResponse);

    function onResponse(err, tres) {
        assert.ifError(err);

        assert.equal(tres.statusCode, 200);
        assert.equal(tres.httpVersion, '1.1');
        assert.deepEqual(tres.headers, {});
        assert.deepEqual(tres.body, {
            'moo': 'invalid-property'
        });
        assert.deepEqual(Object.keys(tres).sort(), [
            'body', 'headers', 'httpVersion', 'statusCode'
        ]);

        fakeStatsd.stats.forEach(function(stat) {
            if (stat.key.indexOf('prober') !== -1) {
                assert.fail("Prober fired a statsd when it should be disabled");
            }
        });

        assert.end();
    }
});

test('can return error validating response', function t(assert) {
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

            assert.deepEqual(Object.keys(opts).sort(), [
                'headers', 'json', 'method', 'timeout', 'transformUrlFn', 'url'
            ]);

            cb(null, {
                statusCode: 500,
                httpVersion: '1.1',
                headers: {},
                body: {
                    'message': 'Internal service error'
                }
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
        resource: '.read',
        filterRequest: true,
        filterResponse: true,
        validateRequest: true,
        validateResponse: false
    }, onResponse);

    function onResponse(err, tres) {
        assert.ifError(err);

        assert.equal(tres.statusCode, 500);
        assert.equal(tres.httpVersion, '1.1');
        assert.deepEqual(tres.headers, {});
        assert.deepEqual(tres.body, {
            'message': 'Internal service error'
        });
        assert.deepEqual(Object.keys(tres).sort(), [
            'body', 'headers', 'httpVersion', 'statusCode'
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
        resource: '.read',
        filterRequest: true,
        filterResponse: true,
        validateRequest: true,
        validateResponse: true
    }, onResponse);

    function onResponse(err, tres) {
        assert.ok(err);

        assert.equal(err.message, 'Required');
        assert.equal(err.attribute, 'body');

        assert.end();
    }
});
