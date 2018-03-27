// provides a slack integration service to the API server, this allows posts to be
// sent to and received from our slack bot

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module');
const SlackBotClient = require('./slack_bot_client');
const HttpProxy = require('express-http-proxy');

const SLACK_INTEGRATION_ROUTES = [
	{
		method: 'put',
		path: 'no-auth/slack-enable',
		requestClass: require('./slack_enable_request')
	},
	{
		method: 'post',
		path: 'no-auth/slack-post',
		requestClass: require('./slack_post_request')
	}
];

class SlackIntegration extends APIServerModule {

	services () {
		// return a function that, when invoked, returns a service structure with the pubnub client as
		// the messager service
		return async () => {
			if (!this.api.config.slack || !this.api.config.slack.slackBotOrigin) {
				return this.api.warn('Will not connect to Slack, no Slack configuration or origin supplied');
			}

			this.api.log('Connecting to Slack bot...');
			this.slackBotClient = new SlackBotClient(this.api.config.slack);
			return { slack: this.slackBotClient };
		};
	}

	getRoutes () {
		// provide a route for incoming posts from the slack-bot
		return SLACK_INTEGRATION_ROUTES;
	}

	// initialize the module
	async initialize () {
		// proxying these requests to the slackbot for authorization flow
		// and message reception
		const reconstructQuery = (request) => {
			// yeah, B.S. ... the npm proxy module doesn't pass through ordinary query parameters
			return Object.keys(request.query).map(param => `${param}=${request.query[param]}`).join('&');
		};
		const slackOriginUrl = this.api.config.slack.slackBotOrigin;
		if (!slackOriginUrl) { return; }

		// unfortunately, we can get messages from slack of x-www-form-urlencoded type,
		// but really it's just json data in disguise ... we need to capture this data
		// raw and pass it through
		this.api.express.use(this.formEncodingToRaw);

		// addtoslack ... called by the plugin client to enable slack integration ... passes through
		// to slack bot and thence to slack for OAuth
		this.api.express.use('/no-auth/slack/addtoslack', HttpProxy(slackOriginUrl, {
			proxyReqPathResolver: (request) => {
				return '/addtoslack?' + reconstructQuery(request);
			}
		}));

		// oauth ... callback from slack passes through to slack bot for authorization
		this.api.express.use('/no-auth/slack/oauth', HttpProxy(slackOriginUrl, {
			proxyReqPathResolver: (request) => {
				return '/oauth?' + reconstructQuery(request);
			}
		}));

		// slack/receive ... slack calls into our bot with a new message (post) ...
		// so we need to pass this through to the bot
		this.api.express.use('/no-auth/slack/receive', HttpProxy(slackOriginUrl, {
			proxyReqPathResolver: () => {
				return '/slack/receive';
			},
			proxyReqBodyDecorator: (bodyContent, srcReq) => {
				if (srcReq.headers['content-type'] === 'application/x-www-form-urlencoded') {
					// for form encoded data, pass the raw data we captured earlier,
					return srcReq.rawBody;
				}
				else {
					// otherwise, normal json...
					return bodyContent;
				}
			}
		}));
	}

	// for application/x-www-form-urlencoded content-type, capture the raw data
	// since we'll be passing this on as is in the request proxy
	formEncodingToRaw (request, response, next) {
		if (request.headers['content-type'] !== 'application/x-www-form-urlencoded') {
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

module.exports = SlackIntegration;
