// handle the PUT /codemarks request to edit attributes of an codemark

'use strict';

const PutRequest = require(process.env.CS_API_TOP + '/lib/util/restful/put_request');

class PutCodeMarkRequest extends PutRequest {

	// authorize the request for the current user
	async authorize () {
		// get the codemark, only someone on the team can update it
		const codemark = await this.data.codemarks.getById(this.request.params.id);
		if (!codemark) {
			throw this.errorHandler.error('notFound', { info: 'codemark' });
		}
		if (!this.user.hasTeam(codemark.get('teamId'))) {
			throw this.errorHandler.error('updateAuth');
		}
	}

	// after the codemark is updated...
	async postProcess () {
		await this.publishCodeMark();
	}

	// publish the codemark to the appropriate messager channel(s)
	async publishCodeMark () {
		const teamId = this.request.params.id.toLowerCase();
		const channel = 'team-' + teamId;
		const message = {
			codemark: this.responseData.codemark,
			requestId: this.request.request.id
		};
		try {
			await this.messager.publish(
				message,
				channel,
				{ request: this.request	}
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish codemark update message to team ${teamId}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe (module) {
		const description = PutRequest.describe(module);
		description.access = 'User must be a member of the team that owns the codemark';
		description.input = {
			summary: description.input,
			looksLike: {
				'streamId': '<If specified, updates the stream ID the codemark belongs to>',
				'postId': '<If specified, updates the post ID that points to this codemark>'
			}
		};
		description.publishes = {
			summary: 'Publishes the updated codemark attributes to the team channel for the team that owns the codemark',
			looksLike: {
				'codemark': '<@@#codemark object#codemark@@>'
			}
		};
		return description;
	}
}

module.exports = PutCodeMarkRequest;
