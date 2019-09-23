// provide a middleware function to parse the incoming request body as json data

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');
const BodyParser = require('body-parser');

class BodyParserModule extends APIServerModule {

	middlewares () {
		return [
			
			// json
			(request, response, next) => {
				if (this.api.config.api.mockMode) {
					return next();
				}

				if (request.path.match(/provider-action/)) {
					var data='';
					//request.setEncoding('utf8');
					request.on('data', function(chunk) { 
						data += chunk;
					});
					request.on('end', function() {
						this.api.log('RAW PROVIDER ACTION BODY: ' + data);
						next();
					});
				}
				else {
					// we only need to obtain the middleware function once
					this.jsonParserFunc = this.jsonParserFunc || BodyParser.json({
						reviver: this.jsonBodyReviver
					});
					this.jsonParserFunc(request, response, next);
				}
			},

			// form-data
			(request, response, next) => {
				if (this.api.config.api.mockMode) {
					return next();
				}

				// form encoded requests are only allowed for requests related to the web sub-system
				if (!request.path.match(/^\/web\//)) {
					return next();
				}

				// we only need to obtain the middleware function once
				this.formParserFunc = this.formParserFunc || BodyParser.urlencoded({ extended: true });
				this.formParserFunc(request, response, next);
			}
		];
	}

	jsonBodyReviver (key, value) {
		if (typeof value === 'string') {
			// remove some weird unicode characters
			/* eslint no-control-regex:0 */
			value = value.replace(/[\u0000-\u0008\u200B-\u200F\u2028-\u202F\uFFFC\uFEFF]/g, '');
		}
		return value;
	}
}

module.exports = BodyParserModule;
