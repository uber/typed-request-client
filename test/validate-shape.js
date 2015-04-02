'use strict';

var test = require('tape');

var ValidateShape = require('../validate-shape.js');

test('can validate object', function t(assert) {
    var shape = new ValidateShape();
    var obj = {
        foo: 'bar'
    };
    var result = shape.validate(obj, {
        type: 'object',
        properties: {
            foo: {type: 'string'}
        },
        required: ['foo']
    });

    assert.strictEqual(result, null);

    assert.end();
});

test('validation error', function t(assert) {
    var shape = new ValidateShape();
    var obj = {};
    var err = shape.validate(obj, {
        type: 'object',
        properties: {
            foo: {type: 'string'}
        },
        required: ['foo']
    });

    assert.equal(err.message, 'Required');
    assert.equal(err.attribute, 'foo');
    assert.equal(err.errors[0].message, 'Required');
    assert.equal(err.errors[0].attribute, 'foo');

    assert.end();
});
