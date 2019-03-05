// provide middleware to parse cookies in the request

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');
const CookieParser = require('cookie-parser');

class CookieParserModule extends APIServerModule {

	middlewares () {
		return (request, response, next) => {
			if (this.api.config.api.mockMode) {
				return next();
			}
			// we only need to obtain the parser function once
			this.cookieParserFunc = this.cookieParserFunc || CookieParser(this.api.config.secrets.cookie);
			return this.cookieParserFunc(request, response, next);
		};
	}
}

module.exports = CookieParserModule;
