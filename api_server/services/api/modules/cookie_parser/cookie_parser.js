'use strict';

var API_Server_Module = require(process.env.CI_API_TOP + '/lib/api_server/api_server_module.js');
var CookieParser = require('cookie-parser');

class Cookie_Parser extends API_Server_Module {

	middlewares () {
		return (request, response, next) => {
			this.cookie_parser_func = this.cookie_parser_func || CookieParser(this.api.config.secret);
			return this.cookie_parser_func(request, response, next);
		};
	}
}

module.exports = Cookie_Parser;