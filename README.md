# typed-request-client

Make HTTP requests using TypedRequest and TypedResponse objects.

## Example

```js
var TypedRequestClient = require('typed-request-client');
var Statsd = require('lynx');

var statsd = Statsd({
    host: 'localhost',
    port: 6379
});

var request = TypedRequestClient({
    clientName: 'my-client',
    statsd: statsd
});

var typedRequest = {
    url: 'http://localhost:9000/',
    method: 'GET',
    headers: {},
    body: { userId: '42' }
};

request(typedRequest, {
    requestSchema: someJSONSchemaForRequest,
    responseSchema: someJSONSchemaForResponse,
    resource: '.read'
}, function (err, typedResponse) {
    // if an IO err happened then err

    // typedResponse is a plain object with
    //  - statusCode (number)
    //  - httpVersion (string)
    //  - headers (object)
    //  - body (object)
});
```

## Scope

The `typed-request-client` module will do the following for you:

 - Make HTTP client requests using `TypedRequest` and
    `TypedResponse` interfaces.
 - Wrap your HTTP client request in a `Prober` using the
    `airlock` module.
 - Validate the `TypedRequest` and `TypedResponse` as per the
    supplied `requestSchema` and `responseSchema`.
 - Add statsd integration to your service, it will write four
    different keys, `increment:request`, `timing:request-time`,
    `increment:statusCode`, `timing:total-time`

## Docs

### `var makeReq = TypedRequestClient(opts)`

To create a TypedRequestClient you must pass a number of options.

When you create one it will return a `makeReq` function you can call.

#### `opts.clientName`

You must pass a `clientName` into the `TypedRequestClient`. This
    will be a name used the statsd events being emitted.

This means you should pick a name you want to use for statsd.

#### `opts.statsd`

You must pass in a working `statsd` client. A statsd client is
    required since the `TypedRequestClient` must output statsd.

A valid statsd client has at least two methods:

 - `statsd.increment(listOfKeys)`
 - `statsd.timing(listsOfKeys, numericTimeDelta)`

#### `opts.request`

You can optionally pass in a different `request` function. This
    will default to `mikeal/request` from npm if you do not pass
    one in.

#### `opts.now`

You can optionally pass in a different `now` function. This
    will default to `Date.now()` from ES5 if you do not pass one
    in.

### `makeReq(typedRequest, options, callback)`

The function returned from `TypedRequestClient` allows you to
    make typed requests to a server.

The `makeReq` interface is purposefully low level and kept
    simple. You must supply all information.

#### `typedRequest`

The first argument is the `typedRequest` you want to make.

```jsig
type TypedRequest : {
    url: String,
    method?: "OPTIONS" | "GET" | "HEAD" | "POST" | "PUT" |
        "DELETE" | "TRACE" | "PATCH",
    query?: Object<String, String>,
    headers?: Object<String, String>,
    body?: Any
}

```

A `TypedRequest` is a plain javascript object that looks similar
    to a `HttpRequest` from node core, however it is not a stream.

The `url` property must be a valid full URI including host & port

The `method` property must be a valid HTTP method. It will
    default to the `"GET"` HTTP method.

The `query` property is an optional object you can pass. It will
    be serialized to a string using the `querystring` module
    and correctly appended to the url you passed.

If you pass a `query` ensure that there are no querystring
    parameters on the `url`.

The `headers` property is an optional object of headers. If you
    pass any headers then they will be used as part of the
    outgoing HTTP request.

The `body` property is an optional javascript object to send
    as part of the HTTP request. If set to valid JSON then the
    `makeReq` function will send your value as a JSON encoded
    string as part of the outgoing HTTP request.

#### `options`

The second argument is `options` and it is required.

```jsig
type HandlerOptions : {
    requestSchema: JSONSchema,
    responseSchema: JSONSchema,
    resource: String
}
```

You must specifiy a `requestSchema` which must be a valid
    JSONSchema object.

This will be used to validate the `typedRequest` argument.

Feel free to look at [integration tests](test/integration.js)
    for an example of a valid requestSchema.

You must specify a `responseSchema` which must be a valid
    JSONSchema object.

This will be used to validate the `typedResponse` argument
    coming out of the callback from the outgoing HTTP request.

You must specify a `resource` name which must be a string and
    will be used when emitting stats events.

#### `callback(error, typedResponse)`

The `callback` to `makeReq` is the third and final argument. It
    will get called with an `Error` or a `TypedResponse`.

If you get an `Error` then that's either an IO error or a
    validation error.

If you get a `typedResponse` then that will look like:

```jsig
type TypedResponse : {
    httpVersion: String,
    statusCode: Number,
    headers: Object<String, String>
    body?: Any
}
```

The `typedResponse` will have a `httpVersion` field that is the
    version of HTTP used.

The `typedResponse` will have a `statusCode` field that is the
    statusCode of response to the outgoing HTTP request.

The `typedResponse` will have a `headers` field that is an
    object of heeaders returned by the outgoing HTTP request.

The `body` will be the HTTP body of the HTTP response.

## Extending

The typed request client as exported by `typed-request-client` uses a default
stack of configurable adapters.
These can be customized.
Each of these layers is exported by various modules under `adapters` and can be
coposed as a pipeline as exported by `make-typed-request/adapt`.

```js
var adapt = require('make-typed-request/adapt');
function MyTypedRequestClient(options) {
    return adapt()
        .probing(options)
        .statsdMeasure(options, 'requestTime')
        .statsdReportStatusCode(options)
        .validating(options)
        .statsdReportRequestMade(options)
        .statsdMeasure(options, 'totalTime')
        .statsd(options)
        .valueOf();
}
```

We use the `enchain` module to create fluent interfaces based on a collection
of adapter methods.
This layer can be bypassed.

```js
var TypedRequestClient = require('make-typed-request/make-typed-request');
var Validating = require('make-typed-request/adapters/validating');
var MyTypedRequestClient = Validating(TypedRequestClient, {});
```

Additional client adapters can be made as functions that accept a client as
their first argument and return a decorated client.
By convention we pass a shared `options` object through every adapter, but
further arguments may be adapter instance specific.

```js
function MyAdapter(client, options, myArgument) {
    return myClient;
    function myClient(request, shared, respond) {
        // Intercept request
        client(request, shared, onResponse);
        function onResponse(error, response) {
            // Observe progress
            if (error) { respond(error); }
            // Intercept response
            respond(null, response);
        }
    }
}
```

You can then create your own adapter chain vocabulary with `enchain`.
All of the adapters that this package provides are exported as a single object
from `typed-request-client/adapters`, that you may mix into your own chains.

```js
var enchain = require('enchain');
var adapt = enchain({
    validating: require('make-typed-request/adapters').validating,
    // etc
    myAdapter: require('./my-adapter')
});
var TypedRequestClient = require('make-typed-request/make-typed-request');
var options = {
    requestSchema: someJSONSchemaForRequest,
    responseSchema: someJSONSchemaForResponse
};
var MyTypedRequestClient = adapt(TypedRequestClient)
    .myAdapter(options, myArgument)
    .validating(options)
    .valueOf()
```

## Installation

`npm install typed-request-client`

## Tests

`npm test`

## Contributors

 - Raynos

## MIT Licenced

