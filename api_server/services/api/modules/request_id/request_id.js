'use strict';

var API_Server_Module = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');
var Express_Request_ID = require('express-request-id');

class Request_ID extends API_Server_Module {

	middlewares () {
		return (request, response, next) => {
			this.request_id_func = this.request_id_func || Express_Request_ID();
			return this.request_id_func(request, response, next);
		};
	}
}

module.exports = Request_ID;
