'use strict';

module.exports = Result;

function Result(type, error, ok) {
    if (!(this instanceof Result)) {
        return new Result(type, error, ok);
    }

    this.type = type;
    this.error = error;
    this.ok = ok;
}

Result.Ok = function Ok(ok) {
    return new Result('ok', null, ok);
};

Result.Error = function Error(error) {
    return new Result('error', error, null);
};
