'use strict';

var test = require('tape');

var TypedRequestClient = require('../index.js');

test('throws without options', function t(assert) {
    assert.throws(function throwIt() {
        TypedRequestClient();
    }, /Expected options to be defined/);

    assert.end();
});

test('throws without options.clientName', function t(assert) {
    assert.throws(function throwIt() {
        TypedRequestClient({});
    }, /Expected `options.clientName` to be defined/);

    assert.end();
});

test('throws without options.statsd', function t(assert) {
    assert.throws(function throwIt() {
        TypedRequestClient({clientName: 'test'});
    }, /Expected `options.statsd` to be defined/);

    assert.end();
});
