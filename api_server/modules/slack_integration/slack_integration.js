// provides a slack integration service to the API server, this allows posts to be
// sent to and received from our slack bot

'use strict';

const IntegrationModule = require(process.env.CS_API_TOP + '/lib/util/integrations/integration_module');

class SlackIntegration extends IntegrationModule {

	constructor(options) {
		super(options);
		this.integrationName = 'slack';
	}

	// initialize the module
	async initialize () {
		await super.initialize();

		const slackOriginUrl = this.api.config.slack.botOrigin;
		if (!slackOriginUrl) { return; }

		// proxy these paths to the slack bot
		[
			'/no-auth/slack/receive',
			'/no-auth/slack/oauth',
			'/no-auth/slack/addtoslack'
		].forEach(path => {
			this.api.express.use(
				path,
				this.formEncodingToRaw,
				this.integrationProxy(slackOriginUrl, path)
			);
		});
	}
}

module.exports = SlackIntegration;
