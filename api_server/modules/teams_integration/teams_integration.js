// provides a MS Teams integration service to the API server, this allows posts to be
// sent to and received from our MS Teams bot

'use strict';

const IntegrationModule = require(process.env.CS_API_TOP + '/lib/util/integrations/integration_module');

class TeamsIntegration extends IntegrationModule {

	constructor(options) {
		super(options);
		this.integrationName = 'teams';
	}

	// initialize the module
	async initialize () {
		await super.initialize();

		const teamsOriginUrl = this.api.config.teams.botOrigin;
		if (!teamsOriginUrl) { return; }

		// proxy these paths to the MSTeams bot
		[
			'/no-auth/msteams/receive',
			'/no-auth/msteams/login',
			'/no-auth/msteams/approve',
			'/no-auth/msteams/login/connect'
		].forEach(path => {
			this.api.express.use(
				path,
				this.formEncodingToRaw,
				this.integrationProxy(teamsOriginUrl, path)
			);
		});
	}
}

module.exports = TeamsIntegration;
