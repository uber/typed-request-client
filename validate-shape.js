var JaySchema = require('jayschema');
var jsonSchemaFilter = require('json-schema-filter');
var normalize = require('jayschema-error-messages');
var ValidationError = require('error/validation');

var Result = require('./result.js');

module.exports = validateShape;

function validateShape(shape, schema) {
    var js = new JaySchema();

    shape = jsonSchemaFilter(schema, shape);
    var validationErrors = js.validate(shape, schema);

    if (validationErrors.length > 0) {
        var fields = normalize(validationErrors).fields;
        var errors = buildErrors(fields);
        var err = ValidationError(errors);
        err.attribute = errors[0].attribute;
        err.original = validationErrors;
        return Result.Error(err);
    } else {
        return Result.Ok(shape);
    }
}

/* ```jsig
type FieldName : String
type Message : String

buildErrors : (Object<FieldName, Array<Message>) =>
    Array<Error & { attribute: FieldName }>
``` */
function buildErrors(fields) {
    var fieldNames = Object.keys(fields);

    return flatten(fieldNames.map(function toErrors(fieldName) {
        var messages = fields[fieldName];

        return messages.map(function toError(message) {
            var err = new Error(message);
            err.attribute = fieldName;
            return err;
        });
    }));
}

function flatten(arr) {
    var list = [];
    return list.concat.apply(list, arr);
}
