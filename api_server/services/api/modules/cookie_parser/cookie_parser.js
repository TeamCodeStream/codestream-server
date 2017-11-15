'use strict';

var APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');
var CookieParser = require('cookie-parser');

class CookieParserModule extends APIServerModule {

	middlewares () {
		return (request, response, next) => {
			this.cookieParserFunc = this.cookieParserFunc || CookieParser(this.api.config.secret);
			return this.cookieParserFunc(request, response, next);
		};
	}
}

module.exports = CookieParserModule;
