var test = require('tape');

var Result = require('../result.js');

test('create Result', function t(assert) {
    var r = Result('ok', null, 42);

    assert.equal(r.type, 'ok');
    assert.equal(r.ok, 42);
    assert.equal(r.error, null);

    assert.end();
});

test('Result.Error()', function t(assert) {
    var r = Result.Error(new Error('foo'));

    assert.equal(r.type, 'error');
    assert.equal(r.ok, null);
    assert.equal(r.error.message, 'foo');

    assert.end();
});

test('Result.Ok()', function t(assert) {
    var r = Result.Ok(42);

    assert.equal(r.type, 'ok');
    assert.equal(r.ok, 42);
    assert.equal(r.error, null);

    assert.end();
});
