'use strict';

var querystring = require('querystring');
var xtend = require('xtend');

var DEFUALT_TIMEOUT = 30 * 1000;

module.exports = makeTypedRequest;

function makeTypedRequest(treq, opts, cb) {
    var request = opts.request;

    var reqOpts = {
        url: treq.url,
        method: treq.method || 'GET',
        headers: treq.headers || {},
        timeout: opts.timeout || DEFUALT_TIMEOUT,
        transformUrlFn: opts.transformUrlFn || undefined
    };

    if (opts.requestOpts) {
        reqOpts = xtend(reqOpts, opts.requestOpts);
    }

    if (treq.body !== undefined) {
        reqOpts.json = treq.body;
    } else {
        reqOpts.json = true;
    }

    if (treq.query) {
        var query = querystring.stringify(treq.query);
        if (query !== '') {
            reqOpts.url = reqOpts.url + '?' + query;
        }
    }

    if (typeof reqOpts.transformUrlFn === 'function') {
        reqOpts.url = reqOpts.transformUrlFn(reqOpts.url);
    }

    request(reqOpts, onResponse);

    function onResponse(err, resp) {
        if (err) {
            return cb(err);
        }

        var tres = {
            httpVersion: resp.httpVersion,
            headers: resp.headers,
            statusCode: resp.statusCode,
            body: resp.body
        };

        cb(null, tres);
    }
}
