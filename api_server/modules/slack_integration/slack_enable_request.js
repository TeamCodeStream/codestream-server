// fulfill the PUT /slack-enable request, to enable slack integration for a given team

'use strict';

var RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Errors = require('./errors');

class SlackEnableRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
	}

	// authorize the client (slack-bot) to make this request
	authorize (callback) {
		// FIXME: we are wide open for now
		return callback();

/*
		// we rely on a secret, known only to the slack-bot and the
		// API server ... disallowing arbitrary clients to call this request
		if (this.request.body.secret !== this.api.config.secrets.integration) {
			return callback(this.errorHandler.error('unauthorized'));
		}
		callback();
*/
	}

	// process the request...
	process(callback) {
		BoundAsync.series(this, [
			this.requireAllow,
			this.setEnabled
		], callback);
	}

	// these parameters are required and/or optional for the request
	requireAllow (callback) {
		this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['teamId'/*, 'secret'*/],
					boolean: ['enable']
				},
				optional: {
					'object': ['info']
				}
			},
			callback
		);
	}

	// set the integration as enabled (or disabled) for the given team
	setEnabled (callback) {
		this.teamId = this.request.body.teamId.toLowerCase();
		this.op = {
			$set: {
				"integrations.slack.enabled": this.request.body.enable,
				modifiedAt: Date.now()
			}
		};
		if (this.request.body.info) {
			this.op.$set["integrations.slack.info"] = this.request.body.info;
		}
		this.data.teams.applyOpById(
			this.teamId,
			this.op,
			callback
		);
	}

	// after the request is complete, publish the integration enable/disable message
	// to the members of the team
	postProcess (callback) {
		let channel = 'team-' + this.teamId;
		let message = {
			team: Object.assign({}, this.op, { _id: this.teamId }),
			requestId: this.request.id
		};
		this.api.services.messager.publish(
			message,
			channel,
			error => {
				if (error) {
					// this doesn't break the chain, but it is unfortunate...
					this.warn(`Could not publish team integration enable message to team ${this.teamId}: ${JSON.stringify(error)}`);
				}
				callback();
			},
			{
				request: this
			}
		);
	}
}

module.exports = SlackEnableRequest;
