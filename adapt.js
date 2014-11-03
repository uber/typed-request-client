var enchain = require('enchain');
var makeTypedRequest = require('./make-typed-request.js');
var adapters = require('./adapters.js');

var chain = enchain(adapters);

module.exports = adapt;
function adapt(myMakeTypedRequest) {
    return chain({request: myMakeTypedRequest || makeTypedRequest});
}
