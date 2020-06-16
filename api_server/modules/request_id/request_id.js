// provide middleware to generate a request ID and add it to incoming express requests

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');
const ExpressRequest_ID = require('express-request-id');
const UUID = require('uuid/v4');

class RequestID extends APIServerModule {

	middlewares () {
		return (request, response, next) => {
			if (this.api.config.api.mockMode) {
				request.id = UUID();
				return next();
			}
			this.requestIdFunc = this.requestIdFunc || ExpressRequest_ID();
			return this.requestIdFunc(request, response, next);
		};
	}
}

module.exports = RequestID;
