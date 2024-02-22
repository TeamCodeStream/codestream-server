// provides a middleware function to log incoming requests

'use strict';

const APIServerModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_server_module.js');

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
			response.on('complete', () => {
				// fully done, no more work to do at all
				this.logRequest(request, response, 'DONE', startTimer);
			});
			response.on('timeout', () => {
				// an abnormal finish, like an uncaught or express error
				this.logRequest(request, response, 'TIMEOUT', startTimer);
			});
			process.nextTick(next);
		};
	}

	logRequest (request, response, status, startTimer) {
		if (this.disableLogRequest(request)) {
			return;
		}

		const elapsedTime = Date.now() - startTimer;
		const userId = (request.user && request.user.id) || '???';
		const ide = request.headers['x-cs-plugin-ide'] || '???';
		const pluginVersion = request.headers['x-cs-plugin-version'] || '???';
		const ideVersion = request.headers['x-cs-ide-version'] || '???';
		const clientMachineId = request.headers['x-cs-client-machine-id'] || '???';
		let ip = request.headers['x-forwarded-for'];
		if (!ip && request.connection) {
			const addr = request.connection.remoteAddress;
			if (addr) {
				ip = addr.split(':').pop() || '???';
			}
			else {
				ip = '???';
			}
		}
		const testNum = request.headers['x-cs-test-num'] || '';

		// obfuscate trello tokens during OAuth
		const url = request.url.replace(/(\/no-auth\/provider-token\/trello\?token=)(.*?)($|&)/, (_, p1, p2, p3) => {
			return `${p1}${'*'.repeat(p2.length)}${p3}`;
		});

		const json = {
			id: request.id,
			stat: status,
			meth: request.method.toUpperCase(),
			url,
			uid: userId,
			code: response.statusCode,
			len: response.get('content-length'),
			time: elapsedTime,
			ip,
			ref: request.headers.referer,
			uag: request.headers['user-agent'],
			ide,
			ver: pluginVersion,
			idev: ideVersion,
			tnum: testNum,
			cmi: clientMachineId
		};
			
		const text = 
			request.id                     + ' '   +
			status                         + ' '   +
			request.method.toUpperCase()   + ' '   +
			url                            + ' '   +
			userId                         + ' '   +
			response.statusCode            + ' '   +
			response.get('content-length') + ' '   +
			elapsedTime                    + ' '   +
			ip                             + ' "'  +
			request.headers.referer        + '" "' +
			request.headers['user-agent']  + '" "' + 
			ide                            + '" "' +
			pluginVersion                  + '" "' + 
			ideVersion                     + '" "'  +
			clientMachineId                + '" '  +
			testNum;				

		this.api.log(text, request.id, 'info', {}/*, json*/);
	}

	disableLogRequest (request) {
		if (
			this.api.config.apiServer.dontLogHealthChecks &&
			request.method.toLowerCase() === 'get' &&
			request.url === '/no-auth/status'
		) {
			return true;
		}
		return false;
	}
}

module.exports = AccessLogger;
