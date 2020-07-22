// handle the "POST /add-blame-map/:teamId" to add a blame-map entry

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');

class AddBlameMapRequest extends RestfulRequest {

	async authorize () {
		// user must be a member of the team
		if (!this.user.hasTeam(this.request.params.teamId)) {
			throw this.errorHandler.error('updateAuth', { reason: 'user must be a member of the team' });
		}
	}

	// process the request...
	async process () {
		await this.requireAndAllow();	// require certain parameters, discard unknown ones
		await this.getTeam();			// get the team
		await this.validateUser();		// validate the user exists and is on the team
		await this.updateTeam();		// update the team with the tag
	}

	// require certain parameters, and discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['email', 'userId']
				}
			}
		);
	}

	// get the team
	async getTeam () {
		this.team = await this.data.teams.getById(this.request.params.teamId.toLowerCase());
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team' });
		}
	}

	// validate the user exists and is on the team
	async validateUser () {
		this.blameUser = await this.data.users.getById(this.request.body.userId.toLowerCase());
		if (!this.blameUser) {
			throw this.errorHandler.error('notFound', { info: 'user' });
		}
		if (!this.blameUser.hasTeam(this.team.id)) {
			throw this.errorHandler.error('invalidParameter', { reason: 'blame user must be on the team' });
		}
	}

	// update the team settings with the new blame-map
	async updateTeam () {
		const emailKey = this.request.body.email.replace(/\./g, '*'); // since mongo doesn't allow '.' in key names
		const userId = this.request.body.userId.toLowerCase();
		const op = {
			$set: {
				[`settings.blameMap.${emailKey}`]: userId,
				modifiedAt: Date.now()
			}
		};
		this.updateOp = await new ModelSaver({
			request: this,
			collection: this.data.teams,
			id: this.team.id
		}).save(op);
	}

	// handle returning the response
	async handleResponse () {
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
			this.warn(`Unable to publish add-blame-map message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'add-blame-map',
			summary: 'Add a blame map entry for a given user for a team',
			access: 'Only a member of the team can add a blame map entry',
			description: 'Adds a new blame map entry to the team settings. The entry is a key/value pair under the blameMap property of the team settings, with email as the key and userId as the value. In the email, "." is replaced with "*" to avoid mongo limitations.',
			input: {
				summary: 'Specify the blame map entry in the request body.',
				looksLike: {
					'email*': '<Email of the user to be blamed>',
					'userId': '<ID of the user to "take the blame">'
				}
			},
			returns: {
				summary: 'A team object, with directives appropriate for adding the blame map entry to the team settings',
				looksLike: {
					team: '<some directive>'
				}
			},
			publishes: {
				summary: 'A team object, with directives appropriate for adding the blame map entry to the team settings',
				looksLike: {
					team: '<some directive>'
				}
			},
			errors: [
				'notFound',
				'parameterRequired',
				'invalidParameter',
				'updateAuth'
			]
		};
	}
}

module.exports = AddBlameMapRequest;
