// provide service to handle New Relic credential authorization

'use strict';

const OAuthModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/oauth/oauth_module.js');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');

const OAUTH_CONFIG = {
	provider: 'newrelic',
	host: 'newrelic.com',
	needsConfigure: true
};

const ROUTES = [
	{
		method: 'get',
		path: '/no-auth/nr-ingest-key',
		func: 'handleNRIngestKey',
		describe: 'describeNRIngestKey'
	}
];

class NewRelicAuth extends OAuthModule {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}

	getRoutes () {
		return ROUTES;
	}

	async providerInfoHook (info) {
		if (!info.data || !info.data.accessToken || !info.teamId || !info.request) { return; }

		const team = await info.request.data.teams.getById(info.teamId);
		if (!team) { return; }
		const company = await info.request.data.companies.getById(team.get('companyId'));
		if (!company) { return; }
		if (company.get('isNRConnected')) { return;}
		return this.setCompanyConnected(company, info.request);
	}

	async setCompanyConnected (company, request) {
		const op = {
			$set: {
				isNRConnected: true,
				modifiedAt: Date.now()
			}
		};
		request.transforms.company = company;
		request.transforms.updateCompanyOp = await new ModelSaver({
			request,
			collection: request.data.companies,
			id: company.id
		}).save(op);
	}

	async providerInfoPostProcessHook (info) {
		if (
			!info.request ||
			!info.request.transforms ||
			!info.request.transforms.company ||
			!info.request.transforms.updateCompanyOp ||
			!info.teamId
		) {
			return;
		}

		const message = {
			company: Object.assign(
				{
					id: info.request.transforms.company.id
				},
				info.request.transforms.updateCompanyOp
			),
			requestId: info.request.request.id
		};
		const channel = `team-${info.teamId}`;
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: info.request }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			info.request.warn(`Could not publish company update to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}

	// handle request to fetch ingest key information for New Relic data ingest,
	// one level of indirection used to retrieve the keys the client will use for ingest
	handleNRIngestKey (request, response) {
		if (!request.headers['x-cs-plugin-ide']) {
			const error = 'IDE key not present in header';
			this.api.warn(error);
			return response.status(403).send({ error });
		}

		const { 
			browserIngestKey,
			licenseIngestKey,
			telemetryEndpoint,
			webviewAgentId,
			webviewAppId,
			accountNumber
		} = this.api.config.integrations.newrelic;
		response.send({
			browserIngestKey,
			licenseIngestKey,
			telemetryEndpoint,
			webviewAgentId,
			webviewAppId,
			accountId: accountNumber
		});
	}

	describeIngestKey () {
		return {
			tag: 'nr-ingest-key',
			summary: 'Retrieve ingest key for New Relic APM',
			description: 'Retrieve ingest key and other info for use with New Relic application monitoring',
			access: 'User must provide the secret',
			input: 'Specify the secret in the query parameter "secret"',
			returns: {
				summary: 'The New Relic ingest key to use when initializing client-side New Relic APM',
				looksLike: {
					browserIngestKey: '<The key for browser ingest>',
					licenseIngestKey: '<The key for agent ingest>',
					telemetryEndpoint: '<Endpoint hostname for ingest collector>'
				}
			}
		};
	}
}

module.exports = NewRelicAuth;
