'use strict';

var APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');

const ROUTES = [
	{
		method: 'get',
		path: 'no-auth/status',
		func: 'handleStatus'
	}
];

class HealthChecker extends APIServerModule {

	getRoutes () {
		return ROUTES;
	}

	handleStatus (request, response) {
		if (this.api.shutdownPending) {
			response.status(410).send('SHUTDOWN PENDING');
		}
		else {
			response.status(200).send('OK');
		}
	}
}

module.exports = HealthChecker;
