// provide middleware to generate a request ID and add it to incoming express requests

'use strict';

const APIServerModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_server_module.js');
const ExpressRequest_ID = require('express-request-id');
const UUID = require('uuid').v4;

class RequestID extends APIServerModule {

	middlewares () {
		return (request, response, next) => {
			if (this.api.config.apiServer.mockMode) {
				request.id = UUID();
				return next();
			}
			this.requestIdFunc = this.requestIdFunc || ExpressRequest_ID();
			return this.requestIdFunc(request, response, next);
		};
	}
}

module.exports = RequestID;
