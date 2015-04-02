'use strict';

var test = require('tape');
var request = require('request');
var http = require('http');
var parseJSON = require('body/json');
var sendError = require('send-data/error');
var sendJSON = require('send-data/json');

var makeTypedRequest = require('../make-typed-request.js');

var reqOpts = {
    request: request
};

function createServer(onPort) {
    var server = http.createServer(onRequest);

    server.listen(0, onListening);

    return server;

    function onRequest(req, res) {
        parseJSON(req, res, onJSON);

        function onJSON(err, json) {
            if (err) {
                return sendError(req, res, err);
            }

            sendJSON(req, res, {
                headers: {},
                body: {
                    req: json,
                    url: req.url,
                    method: req.method
                }
            });
        }
    }

    function onListening() {
        var address = server.address();

        onPort(address.port);
    }
}

test('can make request', function t(assert) {
    var server = createServer(function onPort(port) {
        var treq = {
            method: 'GET',
            url: 'http://localhost:' + port + '/',
            body: {'hello': 'world'}
        };

        makeTypedRequest(treq, reqOpts, onResponse);

        function onResponse(err, resp) {
            assert.ifError(err);

            assert.equal(resp.httpVersion, '1.1');
            assert.ok(resp.headers);
            assert.equal(resp.statusCode, 200);
            assert.equal(resp.headers['content-type'],
                'application/json');
            assert.deepEqual(resp.body, {
                method: 'GET',
                url: '/',
                req: {
                    'hello': 'world'
                }
            });

            server.close();
            assert.end();
        }
    });
});

test('request with POST', function t(assert) {
    var server = createServer(function onPort(port) {
        var treq = {
            method: 'POST',
            url: 'http://localhost:' + port + '/',
            body: {'hello': 'world'}
        };

        makeTypedRequest(treq, reqOpts, onResponse);

        function onResponse(err, resp) {
            assert.ifError(err);

            assert.equal(resp.httpVersion, '1.1');
            assert.ok(resp.headers);
            assert.equal(resp.headers['content-type'],
                'application/json');
            assert.deepEqual(resp.body, {
                method: 'POST',
                url: '/',
                req: {
                    'hello': 'world'
                }
            });

            server.close();
            assert.end();
        }
    });
});

test('request with GET', function t(assert) {
    var server = createServer(function onPort(port) {
        var treq = {
            method: 'GET',
            url: 'http://localhost:' + port + '/',
            query: {'hello': 'world'},
            body: {}
        };

        makeTypedRequest(treq, reqOpts, onResponse);

        function onResponse(err, resp) {
            assert.ifError(err);

            assert.equal(resp.httpVersion, '1.1');
            assert.ok(resp.headers);
            assert.equal(resp.headers['content-type'],
                'application/json');
            assert.deepEqual(resp.body, {
                method: 'GET',
                url: '/?hello=world',
                req: {}
            });

            server.close();
            assert.end();
        }
    });
});

test('request with default method', function t(assert) {
    var server = createServer(function onPort(port) {
        var treq = {
            url: 'http://localhost:' + port + '/',
            body: {'hello': 'world'}
        };

        makeTypedRequest(treq, reqOpts, onResponse);

        function onResponse(err, resp) {
            assert.ifError(err);

            assert.equal(resp.httpVersion, '1.1');
            assert.ok(resp.headers);
            assert.equal(resp.headers['content-type'],
                'application/json');
            assert.deepEqual(resp.body, {
                method: 'GET',
                url: '/',
                req: {
                    'hello': 'world'
                }
            });

            server.close();
            assert.end();
        }
    });
});

test('request without body', function t(assert) {
    var server = http.createServer(function onReq(req, res) {
        res.end('"hello world"');
    });
    server.listen(0, function onPort() {
        var port = server.address().port;

        var treq = {
            method: 'GET',
            url: 'http://localhost:' + port + '/'
        };

        makeTypedRequest(treq, reqOpts, onResponse);

        function onResponse(err, resp) {
            assert.ifError(err);

            assert.equal(resp.httpVersion, '1.1');
            assert.ok(resp.headers);
            assert.deepEqual(resp.body, 'hello world');

            server.close();
            assert.end();
        }
    });
});

test('request that has network error', function t(assert) {
    var server = http.createServer(function onReq(req, res) {
        res.destroy();
    });
    server.listen(0, function onPort() {
        var port = server.address().port;

        var treq = {
            method: 'GET',
            url: 'http://localhost:' + port + '/'
        };

        makeTypedRequest(treq, reqOpts, onResponse);

        function onResponse(err, resp) {
            assert.ok(err);
            assert.equal(err.code, 'ECONNRESET');

            assert.equal(resp, undefined);

            server.close();
            assert.end();
        }
    });
});

test('request that has 500', function t(assert) {
    var server = http.createServer(function onReq(req, res) {
        res.statusCode = 500;
        res.end('"OOPS"');
    });
    server.listen(0, function onPort() {
        var port = server.address().port;

        var treq = {
            method: 'GET',
            url: 'http://localhost:' + port + '/'
        };

        makeTypedRequest(treq, reqOpts, onResponse);

        function onResponse(err, resp) {
            assert.ifError(err);

            assert.equal(resp.httpVersion, '1.1');
            assert.equal(resp.statusCode, 500);
            assert.ok(resp.headers);
            assert.deepEqual(resp.body, 'OOPS');

            server.close();
            assert.end();
        }
    });
});

test('request that has transformUrlFn', function t(assert) {
    var server = createServer(function onPort(port) {
        var treq = {
            method: 'GET',
            url: 'http://localhost:' + port + '/',
            query: {prop: ['a,b', 'c,d']},
            body: {'hello': 'world'}
        };

        var transformReqOpts = {
            // special request to return the modified query
            request: function r(opts, cb) {
                assert.equal(opts.url, treq.url + '?prop=a,b&prop=c,d');

                cb(null, {
                    statusCode: 200,
                    httpVersion: '1.1',
                    headers: {},
                    body: {}
                });
            }
        };

        function transformUrlFn(url) {
            // Restore all the ',' from being stringify'ed
            return url.replace(/%2C/g, ',');
        }

        transformReqOpts.transformUrlFn = transformUrlFn;

        makeTypedRequest(treq, transformReqOpts, onResponse);

        function onResponse(err, resp) {
            assert.ifError(err);

            server.close();
            assert.end();
        }
    });
});
