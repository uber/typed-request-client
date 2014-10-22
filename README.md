# typed-request-client

Make HTTP requests using TypedRequest and TypedResponse objects.

## Example

```js
var TypedRequestClient = require('sirvice/typed-request-client');
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
