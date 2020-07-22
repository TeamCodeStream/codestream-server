// handle the "PUT /delete-blame-map/:teamId" to remove a blame-map entry

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');

class DeleteBlameMapRequest extends RestfulRequest {

	async authorize() {
		// user must be a member of the team
		if (!this.user.hasTeam(this.request.params.teamId)) {
			throw this.errorHandler.error('updateAuth', { reason: 'user must be a member of the team' });
		}
	}

	// process the request...
	async process() {
		await this.requireAndAllow();	// require certain parameters, discard unknown ones
		await this.getTeam();			// get the team
		await this.updateTeam();		// update the team with the tag
	}

	// require certain parameters, and discard unknown parameters
	async requireAndAllow() {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['email']
				}
			}
		);
	}

	// get the team
	async getTeam() {
		this.team = await this.data.teams.getById(this.request.params.teamId.toLowerCase());
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team' });
		}
	}

	// update the team settings with the new blame-map
	async updateTeam() {
		const emailKey = this.request.body.email.replace(/\./g, '*'); // since mongo doesn't allow '.' in key names
		const op = {
			$unset: {
				[`settings.blameMap.${emailKey}`]: true
			},
			$set: {
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
	async handleResponse() {
		if (this.gotError) {
			return await super.handleResponse();
		}
		this.responseData = { team: this.updateOp };
		await super.handleResponse();
	}

	// after the response is returned....
	async postProcess() {
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
			this.warn(`Unable to publish delete-blame-map message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe() {
		return {
			tag: 'delete-blame-map',
			summary: 'Delete a blame map entry for a given email',
			access: 'Only a member of the team can delete a blame map entry',
			description: 'Deletes a blame map entry from the team settings, identified by email.',
			input: {
				summary: 'Specify the email in the request body.',
				looksLike: {
					'email*': '<Email of the user entry to be removed>'
				}
			},
			returns: {
				summary: 'A team object, with directives appropriate for removing the blame map entry from the team settings',
				looksLike: {
					team: '<some directive>'
				}
			},
			publishes: {
				summary: 'A team object, with directives appropriate for removing the blame map entry from the team settings',
				looksLike: {
					team: '<some directive>'
				}
			},
			errors: [
				'notFound',
				'parameterRequired',
				'updateAuth'
			]
		};
	}
}

module.exports = DeleteBlameMapRequest;
