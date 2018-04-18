// provides a MS Teams integration service to the API server, this allows posts to be
// sent to and received from our MS Teams bot

'use strict';

const IntegrationModule = require(process.env.CS_API_TOP + '/lib/util/integrations/integration_module');

class TeamsIntegration extends IntegrationModule {

	constructor(options) {
		super(options);
		this.integrationName = 'teams';
	}

}

module.exports = TeamsIntegration;
