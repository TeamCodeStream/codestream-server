// handle the PUT /codemarks/:id/:add-tag request to add a tag to a codemark

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');

class AddTagRequest extends RestfulRequest {

	// authorize the request for the current user
	async authorize () {
		// only a user on the team can add a tag to a codemark
		const codemarkId = this.request.params.id.toLowerCase();
		this.codemark = await this.data.codemarks.getById(codemarkId);
		if (!this.codemark) {
			throw this.errorHandler.error('notFound', { info: 'codemark' });
		}
		if (!this.user.hasTeam(this.codemark.get('teamId'))) {
			throw this.errorHandler.error('updateAuth', { reason: 'user must be a member of the team' });
		}
	}

	// process the request...
	async process () {
		await this.requireAndAllow();	// require parameters, and filter out unknown parameters
		await this.getTeam();			// get the team that owns the codemark
		await this.addTag();			// add the tag
	}

	// require certain parameters, and discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['tagId']
				}
			}
		);
	}

	// get the team that owns the codemark
	async getTeam () {
		this.team = await this.data.teams.getById(this.codemark.get('teamId'));
		if (!this.team) {
			return this.errorHandler.error('notFound', { info: 'team' });	// shouldn't really happen
		}
	}

	// add the tag to the tags array for this codemark
	async addTag () {
		// first ensure it's a valid tag for the team
		const tagId = this.request.body.tagId.toLowerCase();
		const teamTags = this.team.get('tags') || {};
		const tag = Object.keys(teamTags).find(id => {
			return id === tagId && !teamTags[tagId].deactivated;
		});
		if (!tag) {
			throw this.errorHandler.error('notFound', { info: 'tag' });
		}

		// make sure this codemark doesn't already have the tag, or if we're removing,
		// make sure it's not already removed
		if (
			(
				!this.removing && 
				(this.codemark.get('tags') || []).indexOf(tagId) !== -1 
			) ||
			(
				this.removing &&
				(this.codemark.get('tags') || []).indexOf(tagId) === -1
			)
		) {
			return;
		}

		// generate an update op for adding the tag
		const now = Date.now();
		const tagOp = this.removing ? '$pull' : '$addToSet';
		const op = { 
			[tagOp]: { 
				tags: tagId
			},
			$set: {
				modifiedAt: now
			}
		};
		this.updateOp = await new ModelSaver({
			request: this.request,
			collection: this.data.codemarks,
			id: this.codemark.id
		}).save(op);
	}

	async handleResponse () {
		if (this.gotError) {
			return await super.handleResponse();
		}
		this.responseData = { codemark: this.updateOp };
		await super.handleResponse();
	}

	// after the codemarks are related...
	async postProcess () {
		// send message to the team channel
		const channel = 'team-' + this.codemark.get('teamId');
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
			this.warn(`Unable to publish codemark tag message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'add-tag',
			summary: 'Add a tag to a codemark',
			access: 'User must be a member of the team that owns the codemark.',
			description: 'Add a tag to a codemark, specified by tag ID. The tag must be a known tag for the team, according to the ID.',
			input: {
				summary: 'Specify the codemark ID in the request path, and the tag ID in the request body',
				looksLike: {
					tagId: '<ID of the tag to add>'
				}
			},
			returns: {
				summary: 'A codemark, with directives indicating how to update the codemark',
				looksLike: {
					codemark: '<some directive>'
				}
			},
			publishes: 'The response data will be published on the team channel for the team that owns the codemarks',
			errors: [
				'updateAuth',
				'notFound'
			]
		};
	}
}

module.exports = AddTagRequest;
