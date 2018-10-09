// fulfill the integration enable request, to enable integration for a given team

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const Errors = require('./errors');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');

class IntegrationEnableRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
		if (!this.module.integrationConfig) {
			throw 'integration module must have an integration config';
		}
		Object.assign(this, this.module.integrationConfig);
		['integrationName', 'secret', 'botOrigin', 'botReceivePath'].forEach(configOption => {
			if (!this[configOption]) {
				throw `must provide ${configOption} to the integration-enable request`;
			}
		});
	}

	// authorize the client (the integration bot) to make this request
	async authorize () {
		// we rely on a secret, known only to the bot and the
		// API server ... disallowing arbitrary clients to call this request
		if (this.request.body.secret !== this.secret) {
			throw this.errorHandler.error('unauthorized');
		}
	}

	// process the request...
	async process() {
		await this.requireAllow();
		await this.setEnabled();
	}

	// these parameters are required and/or optional for the request
	async requireAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['teamId', 'secret'],
					boolean: ['enable']
				},
				optional: {
					'object': ['info']
				}
			}
		);
	}

	// set the integration as enabled (or disabled) for the given team
	async setEnabled () {
		this.teamId = this.request.body.teamId.toLowerCase();
		const attribute = `integrations.${this.integrationName}.enabled`;
		const op = {
			$set: {
				[attribute]: this.request.body.enable,
				modifiedAt: Date.now()
			}
		};
		const infoAttribute = `integrations.${this.integrationName}.info`;
		if (this.request.body.info) {
			op.$set[infoAttribute] = this.request.body.info;
		}
		this.updateOp = await new ModelSaver({
			request: this,
			collection: this.data.teams,
			id: this.teamId
		}).save(op);
	}

	// after the request is complete, publish the integration enable/disable message
	// to the members of the team
	async postProcess () {
		const channel = 'team-' + this.teamId;
		const message = {
			team: Object.assign({}, this.updateOp, { _id: this.teamId }),
			requestId: this.request.id
		};
		try {
			await this.api.services.messager.publish(
				message,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.warn(`Could not publish team ${this.integrationName} integration enable message to team ${this.teamId}: ${JSON.stringify(error)}`);
		}
	}
}

module.exports = IntegrationEnableRequest;
