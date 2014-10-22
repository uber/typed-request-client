var test = require('tape');

var validateShape = require('../validate-shape.js');

test('can validate object', function t(assert) {
    var obj = {
        foo: 'bar'
    };
    var result = validateShape(obj, {
        type: 'object',
        properties: {
            foo: { type: 'string' }
        },
        required: ['foo']
    });

    assert.equal(result.type, 'ok');
    assert.deepEqual(result.ok, {
        foo: 'bar'
    });
    assert.notEqual(result.ok, obj);

    assert.end();
});

test('validation error', function t(assert) {
    var obj = {};
    var result = validateShape(obj, {
        type: 'object',
        properties: {
            foo: { type: 'string' }
        },
        required: ['foo']
    });

    assert.equal(result.type, 'error');
    var err = result.error;

    assert.equal(err.message, 'Required');
    assert.equal(err.attribute, 'foo');
    assert.equal(err.errors[0].message, 'Required');
    assert.equal(err.errors[0].attribute, 'foo');

    assert.end();
});

test('object trimming', function t(assert) {
    var obj = {
        foo: 'bar',
        bar: 'baz'
    };
    var result = validateShape(obj, {
        type: 'object',
        properties: {
            foo: { type: 'string' }
        },
        required: ['foo']
    });

    assert.equal(result.type, 'ok');
    assert.deepEqual(result.ok, {
        foo: 'bar'
    });
    assert.notEqual(result.ok, obj);
    assert.equal(result.ok.bar, undefined);
    assert.equal(obj.bar, 'baz');

    assert.end();
});
