// provide a middleware function to parse the incoming request body as json data

'use strict';

const APIServerModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_server_module.js');
const BodyParser = require('body-parser');

class BodyParserModule extends APIServerModule {

	middlewares () {
		return [
			
			// json
			(request, response, next) => {
				if (this.api.config.apiServer.mockMode) {
					return next();
				}

				// we only need to obtain the middleware function once
				this.jsonParserFunc = this.jsonParserFunc || BodyParser.json({
					reviver: this.jsonBodyReviver,
					verify: this.slackVerify,
					limit: '20mb'
				});
				this.jsonParserFunc(request, response, next);
			},

			// form-data
			(request, response, next) => {
				if (this.api.config.apiServer.mockMode) {
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

	// this is gross, but to verify json requests from slack we need access to the raw body
	slackVerify (request, response, buffer, encoding) {
		if (request.headers['x-slack-signature'] && request.headers['x-slack-request-timestamp']) {
			request.slackRawBody = buffer.toString(encoding);
		}
	}
}

module.exports = BodyParserModule;
