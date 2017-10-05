'use strict';

var API_Server_Module = require(process.env.CI_API_TOP + '/lib/api_server/api_server_module.js');

class Versioner extends API_Server_Module {

	middlewares () {
		return (request, response, next) => {
			if (request.headers['x-api-version']) {
				request.version = this.parse_version(request.headers['x-api-version']);
			}
			else {
				request.version = this.api.config.version;
			}
			next();
		};
	}

	parse_version (version_string) {
		var parts = version_string.split('.');
		parts = parts.map(part => parseInt(part, 10) || 0);
		return {
			major: parts[0] || 0,
			minor: parts[1] || 0,
			build: parts[2] || 0
		};
	}
}

module.exports = Versioner;
