// provide a middleware function to parse the incoming request body as json data

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');
const BodyParser = require('body-parser');

class BodyParserModule extends APIServerModule {

	middlewares () {
		return (request, response, next) => {
			// we only need to obtain the middleware function once
			this.bodyParserFunc = this.bodyParserFunc || BodyParser.json({
				reviver: this.jsonBodyReviver
			});
			this.bodyParserFunc(request, response, next);
		};
	}

	jsonBodyReviver (key, value) {
		if (typeof value === 'string') {
			// remove some weird unicode characters
			/* eslint  no-control-regex: warn */
			value = value.replace(/[\u0000-\u0008\u200B-\u200F\u2028-\u202F\uFFFC\uFEFF]/g, '');
		}
		return value;
	}
}

module.exports = BodyParserModule;
