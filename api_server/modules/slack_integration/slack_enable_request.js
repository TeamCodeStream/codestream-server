// fulfill the PUT /slack-enable request, to enable slack integration for a given team

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const Errors = require('./errors');

class SlackEnableRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
	}

	// authorize the client (slack-bot) to make this request
	async authorize () {
		// we rely on a secret, known only to the slack-bot and the
		// API server ... disallowing arbitrary clients to call this request
		if (this.request.body.secret !== this.api.config.slack.secret) {
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
		this.op = {
			$set: {
				'integrations.slack.enabled': this.request.body.enable,
				modifiedAt: Date.now()
			}
		};
		if (this.request.body.info) {
			this.op.$set['integrations.slack.info'] = this.request.body.info;
		}
		await this.data.teams.applyOpById(
			this.teamId,
			this.op
		);
	}

	// after the request is complete, publish the integration enable/disable message
	// to the members of the team
	async postProcess () {
		const channel = 'team-' + this.teamId;
		const message = {
			team: Object.assign({}, this.op, { _id: this.teamId }),
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
			this.warn(`Could not publish team integration enable message to team ${this.teamId}: ${JSON.stringify(error)}`);
		}
	}
}

module.exports = SlackEnableRequest;
