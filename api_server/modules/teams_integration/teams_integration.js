// provides a MS Teams integration service to the API server, this allows posts to be
// sent to and received from our MS Teams bot

'use strict';

const IntegrationModule = require(process.env.CS_API_TOP + '/lib/util/integrations/integration_module');
const HttpProxy = require('express-http-proxy');

class TeamsIntegration extends IntegrationModule {

	constructor(options) {
		super(options);
		this.integrationName = 'teams';
	}

	// initialize the module
	async initialize () {
		await super.initialize();
		
		// proxying these requests to the MSTeams bot for authorization flow
		// and message reception
		const reconstructQuery = (request) => {
			// yeah, B.S. ... the npm proxy module doesn't pass through ordinary query parameters
			return Object.keys(request.query).map(param => `${param}=${request.query[param]}`).join('&');
		};
		const teamsOriginUrl = this.api.config.teams.botOrigin;
		if (!teamsOriginUrl) { return; }

		// unfortunately, we can get messages of x-www-form-urlencoded type,
		// but really it's just json data in disguise ... we need to capture this data
		// raw and pass it through
		this.api.express.use(this.formEncodingToRaw);

		// proxy these paths to the MSTeams bot
		[
			'/no-auth/msteams/receive',
			'/no-auth/msteams/login',
			'/no-auth/msteams/approve',
			'/no-auth/msteams/login/connect'
		].forEach(path => {
			this.api.express.use(path, HttpProxy(teamsOriginUrl, {
				proxyReqPathResolver: (request) => {
					const query = reconstructQuery(request);
					return `${path}?${query}`;
				},
				proxyReqBodyDecorator: (bodyContent, srcReq) => {
					if (srcReq.headers['content-type'].match(/application\/x-www-form-urlencoded/)) {
						// for form encoded data, pass the raw data we captured earlier,
						return srcReq.rawBody;
					}
					else {
						// otherwise, normal json...
						return bodyContent;
					}
				}
			}));		
		});
	}

	// for application/x-www-form-urlencoded content-type, capture the raw data
	// since we'll be passing this on as is in the request proxy
	formEncodingToRaw (request, response, next) {
		if (!request.headers['content-type'].match(/application\/x-www-form-urlencoded/)) {
			return next();
		}
		let data = '';
		request.setEncoding('utf8');
		request.on('data', chunk => {
			data += chunk;
		});
		request.on('end', () => {
			request.rawBody = data;
			next();
		});
	}
}

module.exports = TeamsIntegration;
