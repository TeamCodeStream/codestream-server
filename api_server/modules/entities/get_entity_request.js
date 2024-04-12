// handle a GET /entities/:id request to fetch a single New Relic entity

'use strict';

const GetRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/get_request');

class GetEntityRequest extends GetRequest {

}

module.exports = GetEntityRequest;
