// handle the "POST /team-tags/:id" request to create a team tag

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');

class CreateTeamTagRequest extends RestfulRequest {

	async authorize () {
		// user must be a member of the team
		if (!this.user.hasTeam(this.request.params.id)) {
			throw this.errorHandler.error('updateAuth', { reason: 'user must be a member of the team' });
		}
	}

	// process the request...
	async process () {
		await this.requireAndAllow();	// require certain parameters, discard unknown ones
		await this.getTeam();			// get the team
		await this.updateTeam();		// update the team with the tag
	}

	// require certain parameters, and discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['id', 'color']
				},
				optional: {
					string: ['label']
				}
			}
		);
	}

	// get the team
	async getTeam () {
		this.team = await this.data.teams.getById(this.request.params.id.toLowerCase());
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team' });
		}
	}
	
	// update the team with the new tag
	async updateTeam () {
		const tag = this.request.body;
		const tags = this.team.get('tags') || [];
		if (tags.find(existingTag => existingTag.id === tag.id)) {
			throw this.errorHandler.error('exists', { info: 'tag' });
		}

		const op = {
			$push: { tags: tag },
			$set: { modifiedAt: Date.now() }
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
			this.warn(`Unable to publish tag create message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'team-tags',
			summary: 'Create a custom tag for a team',
			access: 'Only a member of the team can add a tag',
			description: 'Adds a new custom tag to the list of custom tags available for codemarks to a team. The tag consists of required id and color field, and optional label field.',
			input: 'Specify the tag attributes in the request body.',
			returns: {
				summary: 'A team object, with directives appropriate for adding the tag for the team',
				looksLike: {
					team: '<some directive>'
				}
			},
			publishes: {
				summary: 'A team object, with directives appropriate for adding the tag for the team',
				looksLike: {
					team: '<some directive>'
				}
			},
			errors: [
				'notFound',
				'parameterRequired',
				'exists',
				'updateAuth'
			]
		};
	}
}

module.exports = CreateTeamTagRequest;
