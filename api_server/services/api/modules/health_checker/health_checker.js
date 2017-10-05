'use strict';

var API_Server_Module = require(process.env.CI_API_TOP + '/lib/api_server/api_server_module.js');

const ROUTES = [
	{
		method: 'get',
		path: 'no-auth/status',
		func: 'handle_status'
	}
];

class Health_Checker extends API_Server_Module {

	get_routes () {
		return ROUTES;
	}

	handle_status (request, response) {
		if (this.api.shutdown_pending) {
			response.status(410).send('SHUTDOWN PENDING');
		}
		else {
			response.status(200).send('OK');
		}
	}
}

module.exports = Health_Checker;
