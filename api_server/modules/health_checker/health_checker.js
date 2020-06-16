// the Health Checker module provides a simple "status" route for a load balancer to use
// to monitor the health of the service

'use strict';

const APIServerModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_server_module.js');

const ROUTES = [
	// status route, to be called periodically by the load balancer
	{
		method: 'get',
		path: 'no-auth/status',
		func: 'handleStatus',
		describe: 'describe'
	}
];

class HealthChecker extends APIServerModule {

	getRoutes () {
		return ROUTES;
	}

	// handle the status request
	handleStatus (request, response) {
		// if we've been requested to shutdown, we'll try to get the load balancer to
		// stop sending us requests ... otherwise we're good to go
		if (this.api.shutdownPending) {
			response.status(410).send('SHUTDOWN PENDING');
		}
		else {
			response.status(200).send('OK');
		}
	}

	describe () {
		return {
			summary: 'Check health status of server',
			description: 'Check health status of server',
			input: '(none)',
			returns: 'OK'
		};
	}
}

module.exports = HealthChecker;
