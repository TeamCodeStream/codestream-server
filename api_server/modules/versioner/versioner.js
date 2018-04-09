// provide middleware to receive a version header from all requests and establish an API version
// to which the request is targeted

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');

class Versioner extends APIServerModule {

	middlewares () {
		return (request, response, next) => {
			if (request.headers['x-api-version']) {
				request.version = this.parseVersion(request.headers['x-api-version']);
			}
			else {
				request.version = this.api.config.version;	// current version
			}
			next();
		};
	}

	// parse the version string and interpret as major/minor/build
	parseVersion (versionString) {
		let parts = versionString.split('.');
		parts = parts.map(part => parseInt(part, 10) || 0);
		return {
			major: parts[0] || 0,
			minor: parts[1] || 0,
			build: parts[2] || 0
		};
	}
}

module.exports = Versioner;
