'use strict';

var ValidateShape = require('../validate-shape.js');
var filter = require('uber-json-schema-filter');

module.exports = ValidatingRequestHandler;
function ValidatingRequestHandler(requestHandler) {
    if (!(this instanceof ValidatingRequestHandler)) {
        return new ValidatingRequestHandler(requestHandler);
    }
    this.requestHandler = requestHandler;
    this.shape = new ValidateShape();
}

ValidatingRequestHandler.prototype.request = handleValidatingRequest;
ValidatingRequestHandler.prototype.response = handleValidatingResponse;
ValidatingRequestHandler.prototype.validateRequest = validateRequest;
ValidatingRequestHandler.prototype.validateResponse = validateResponse;

function handleValidatingRequest(treq, requestOptions, handleResponse) {
    var self = this;
    var filterEnabled = requestOptions.filterRequest;
    var validationEnabled = requestOptions.validateRequest;
    var requestSchema = requestOptions.requestSchema;

    if (filterEnabled) {
        treq = filter(requestSchema, treq);
    }

    if (validationEnabled) {
        var error = self.validateRequest(treq, requestSchema);
        if (error) {
            return handleResponse(error);
        }
    }

    self.requestHandler.request(
        treq,
        requestOptions,
        validatingRequestCallback
    );

    function validatingRequestCallback(err, tres) {
        self.response(err, tres, requestOptions, handleResponse);
    }
}

function handleValidatingResponse(err, tres, requestOptions, handleResponse) {
    if (err) {
        return handleResponse(err);
    }

    var statusCode = tres.statusCode;
    var validate = statusCode < 400 || statusCode >= 600;
    var filterEnabled = validate && requestOptions.filterResponse;
    var validationEnabled = validate && requestOptions.validateResponse;
    var responseSchema = requestOptions.responseSchema;

    if (filterEnabled) {
        tres = filter(responseSchema, tres);
    }

    if (validationEnabled) {
        var error = this.validateResponse(tres, responseSchema);

        if (error) {
            return handleResponse(error);
        }
    }

    handleResponse(null, tres);
}

function validateRequest(treq, schema) {
    var error = this.shape.validate(treq, schema);

    if (error) {
        error.treq = treq;
        error.schema = schema;
    }

    return error;
}

function validateResponse(tres, schema) {
    var error = this.shape.validate(tres, schema);

    if (error) {
        error.tres = tres;
        error.schema = schema;
    }

    return error;
}
