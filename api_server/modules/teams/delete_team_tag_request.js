// handle the "DELETE /team-tags/:teamId/:id" request to delete a team tag

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');

class DeleteTeamTagRequest extends RestfulRequest {

	async authorize () {
		// user must be a member of the team
		if (!this.user.hasTeam(this.request.params.teamId)) {
			throw this.errorHandler.error('updateAuth', { reason: 'user must be a member of the team' });
		}
	}

	// process the request...
	async process () {
		await this.getTeam();			// get the team
		await this.updateTeam();		// update the team with the tag
	}

	// get the team
	async getTeam () {
		this.team = await this.data.teams.getById(this.request.params.teamId.toLowerCase());
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team' });
		}
	}
	
	// update the team, setting the tag as deactivated
	async updateTeam () {
		const tagId = this.request.params.id;
		const tags = this.team.get('tags') || {};
		if (!tags[tagId]) {
			throw this.errorHandler.error('notFound', { info: 'tag' });
		}

		const op = {
			$set: {
				modifiedAt: Date.now(),
				[`tags.${tagId}.deactivated`]: true
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
			this.warn(`Unable to publish tag delete message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'delete-team-tags',
			summary: 'Delete a custom tag for a team',
			access: 'Only a member of the team can delete a tag',
			description: 'Delete a custom tag among the list of custom tags available for codemarks to a team. Really just sets a deactivated flag.',
			input: 'No input body.',
			returns: {
				summary: 'A team object, with directives appropriate for deleting the tag for the team',
				looksLike: {
					team: '<some directive>'
				}
			},
			publishes: {
				summary: 'A team object, with directives appropriate for deleting the tag for the team',
				looksLike: {
					team: '<some directive>'
				}
			},
			errors: [
				'notFound',
				'updateAuth'
			]
		};
	}
}

module.exports = DeleteTeamTagRequest;
