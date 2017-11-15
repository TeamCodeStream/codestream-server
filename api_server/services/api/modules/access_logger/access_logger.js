'use strict';

var APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');

const DEPENDENCIES = [
	'authenticator',
	'request_id'
];

class AccessLogger extends APIServerModule {

	getDependencies () {
		return DEPENDENCIES;
	}

	middlewares () {
		return (request, response, next) => {
			const startTimer = Date.now();
			this.logRequest(request, response, 'BEGIN', startTimer);
			response.on('finish', () => {
				this.logRequest(request, response, 'COMPLETE', startTimer);
			});
			response.on('close', () => {
				this.logRequest(request, response, 'ABORTED', startTimer);
			});
			response.on('complete', () => {
				this.logRequest(request, response, 'DONE', startTimer);
			});
			process.nextTick(next);
		};
	}

	logRequest (request, response, status, startTimer) {
		const elapsedTime = new Date().getTime() - startTimer;  // more like elapsed time until event loop gets to here
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
