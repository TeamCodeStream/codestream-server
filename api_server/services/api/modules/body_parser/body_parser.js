'use strict';

var API_Server_Module = require(process.env.CI_API_TOP + '/lib/api_server/api_server_module.js');
var BodyParser = require('body-parser');

class Body_Parser extends API_Server_Module {

	middlewares () {
		return (request, response, next) => {
			this.body_parser_func = this.body_parser_func || BodyParser.json({
				reviver: this.json_body_reviver
			});
			this.body_parser_func(request, response, next);
		};
	}
	
	json_body_reviver (key, value) {
		if (typeof value === 'string') {
			value = value.replace(/[\u0000-\u0008\u200B-\u200F\u2028-\u202F\uFFFC\uFEFF]/g, '');
		}
		return value;
	}
}

module.exports = Body_Parser;