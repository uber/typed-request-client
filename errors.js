var TypedError = require('error/typed');

var MissingOptions = TypedError({
    type: 'typed-request-client.missing-options',
    message: 'Expected options to be defined.\n' +
        'When calling `TypedRequestClient(...)` you need to ' +
        'pass an options object.\n' +
        'SUGGESTED FIX: Update the `TypedRequestClient()` ' +
        'callsite and add an options argument.\n'
});

var MissingClientName = TypedError({
    type: 'typed-request-client.missing-clientName',
    message: 'Expected `options.clientName` to be defined.\n' +
        'Expected to see a `clientName` property but instead ' +
        'found {optionsStr}.\n' +
        'SUGGESTED FIX: Update the `TypedRequestClient({})` ' +
        'callsite and add `options.clientName`.\n',
    optionsStr: null
});

var MissingStatsd = TypedError({
    type: 'typed-request-client.missing-statsd',
    message: 'Expected `options.statsd` to be defined.\n' +
        'Expected to see a `statsd` property but instead ' +
        'found {optionsStr}.\n' +
        'SUGGESTED FIX: Update the `TypedRequestClient({})` ' +
        'callsite and add `options.statsd`.\n',
    optionsStr: null
});

module.exports = {
    MissingOptions: MissingOptions,
    MissingClientName: MissingClientName,
    MissingStatsd: MissingStatsd
};
