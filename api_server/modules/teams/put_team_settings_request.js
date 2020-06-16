// handle the "PUT /team-settings" request to update a team's settings

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const { opFromHash } = require(process.env.CS_API_TOP + '/lib/util/data_collection/model_ops');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');

const MAX_KEYS = 100;

class PutTeamSettingsRequest extends RestfulRequest {

	async authorize () {
		// user must be an administrator for the team
		const teamId = this.request.params.id.toLowerCase();
		this.team = await this.data.teams.getById(teamId);
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team' });
		}
		if (!(this.team.get('adminIds') || []).includes(this.user.id)) {
			throw this.errorHandler.error('updateAuth', { reason: 'user must be an adminstrator of the team to update its settings' });
		}
	}

	// process the request...
	async process () {
		// determine the update op based on the request body, and apply it if valid
		this.totalKeys = 0;
		const op = opFromHash(this.request.body, 'settings', MAX_KEYS);
		if (typeof op === 'string') {
			throw this.errorHandler.error('invalidParameter', { info: op });
		}
		op.$set = op.$set || {};
		op.$set.modifiedAt = Date.now();
		this.updateOp = await new ModelSaver({
			request: this,
			collection: this.data.teams,
			id: this.team.id
		}).save(op);
	}

	// handle returning the response
	async handleResponse () {
		// we have a special case for an error writing to the database ... rather
		// than return some vague internal error that we normally would on a database
		// error, inform the client that the provided parameter was invalid
		if (
			this.gotError &&
			this.gotError.code === 'MDTA-1000' &&
			typeof this.gotError.reason === 'object' &&
			this.gotError.reason.name === 'MongoError'
		) {
			this.warn(JSON.stringify(this.gotError));
			this.gotError = this.errorHandler.error('invalidParameter');
		}
		if (this.gotError) {
			return await super.handleResponse();
		}
		this.responseData = { team: this.updateOp };
		await super.handleResponse();
	}

	// after the response is returned....
	async postProcess () {
		// send the message to the team channel
		const channel = 'team-' + this.team.id;
		const message = Object.assign({}, this.responseData, { requestId: this.request.id });
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate
			this.warn(`Unable to publish settings message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'team-settings',
			summary: 'Update a team\'s settings',
			access: 'Only an administrator for the team can update the team\'s settings',
			description: 'Updates a team\'s settings object, which is a free-form object, with arbitrary levels of nesting. Only the values specified in the request body will be updated; other values in the settings object will remain unchanged. $set and $unset directives can be used at any nesting level to set or unset a value, respectively.',
			input: 'Specify values to set, up to an arbitrary level of nesting, in the request body.',
			returns: {
				summary: 'A team object, with directives appropriate for updating the team\'s settings',
				looksLike: {
					team: {
						id: '<ID of the team>',
						settings: {
							'<some settings value>': '<some directive>',
							'...': '...'
						}
					}
				}
			},
			publishes: {
				summary: 'Publishes a team object, with directives corresponding to the request body passed in, to the team channel, indicating how the settings object for the team object should be updated.',
				looksLike: {
					team: {
						id: '<ID of the team>',
						settings: {
							'<some settings value>': '<some directive>',
							'...': '...'
						}
					}
				}
			},
			errors: [
				'invalidParameter'
			]
		};
	}
}

module.exports = PutTeamSettingsRequest;
