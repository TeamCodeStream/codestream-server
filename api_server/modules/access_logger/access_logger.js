// provides a middleware function to log incoming requests

'use strict';

var APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');

const DEPENDENCIES = [
	'authenticator',	// needed to get user ID
	'request_id'		// needed to get a request ID
];

class AccessLogger extends APIServerModule {

	getDependencies () {
		return DEPENDENCIES;
	}

	middlewares () {
		return (request, response, next) => {
			// we'll log the beginning of the request (when it first comes in),
			// when the request sends a response, and when the request if fully
			// done (since it might do work after responding to the client) ...
			// or we log if it aborts abnormally
			const startTimer = Date.now();
			this.logRequest(request, response, 'BEGIN', startTimer);
			response.on('finish', () => {
				// when the response is sent to the client
				this.logRequest(request, response, 'RESPONDED', startTimer);
			});
			response.on('close', () => {
				// an abnormal finish, like an uncaught or express error
				this.logRequest(request, response, 'ABORTED', startTimer);
			});
			response.on('complete', () => {
				// fully done, no more work to do at all
				this.logRequest(request, response, 'DONE', startTimer);
			});
			process.nextTick(next);
		};
	}

	logRequest (request, response, status, startTimer) {
		const elapsedTime = Date.now() - startTimer;
		const userId = (request.user && request.user.id) || '???';
		this.logger.log(
			request.id                     + ' '   +
			status                         + ' '   +
			request.method                 + ' '   +
			request.url                    + ' '   +
			userId                        + ' '   +
			response.statusCode            + ' '   +
			response.get('content-length') + ' '   +
			elapsedTime                   + ' '   +
			request.headers.host           + ' "'  +
			request.headers.referer        + '" "' +
			request.headers['user-agent']  + '"'
		);
	}
}

module.exports = AccessLogger;
