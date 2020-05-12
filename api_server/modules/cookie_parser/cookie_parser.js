// provide middleware to parse cookies in the request

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');
const CookieParser = require('cookie-parser');
const CSurf = require('csurf');
const Secrets = require(process.env.CS_API_TOP + '/config/secrets');

const DEPENDENCIES = [
	'body_parser'
];

class CookieParserModule extends APIServerModule {

	getDependencies () {
		return DEPENDENCIES;
	}

	middlewares () {
		// return the cookie parser function followed by CSRF protection function
		return [

			(request, response, next) => {
				// we only need to obtain the parser function once
				this.cookieParserFunc = this.cookieParserFunc || CookieParser(this.api.config.secrets.cookie);
				return this.cookieParserFunc(request, response, next);
			},

			(request, response, next) => {
				if (!this.pathRequiresCsrfProtection(request)) {
					return next();
				}
				if (request.headers['x-csrf-bypass-secret'] === Secrets.confirmationCheat) {
					this.api.warn('Bypassing CSRF check, this has better be a test!');
					return next();
				}
				
				// we only need to obtain the CSurf function once
				this.csurfFunc = this.csurfFunc || CSurf({ cookie: true });
				return this.csurfFunc(request, response, next);
			}
		];
	}

	// for certain paths, cookie authentication is required
	pathRequiresCsrfProtection (request) {
		const paths = this.api.config.api.requiresCsrfProtectionPaths || [];
		return paths.find(path => {
			const regExp = new RegExp(path);
			return request.path.match(regExp);
		});
	}
}

module.exports = CookieParserModule;
