// handle the PUT /codemarks request to edit attributes of an codemark

'use strict';

const PutRequest = require(process.env.CS_API_TOP + '/lib/util/restful/put_request');

class PutCodemarkRequest extends PutRequest {

	// authorize the request for the current user
	async authorize () {
		// get the codemark, only the author can edit a codemark
		const codemark = await this.data.codemarks.getById(this.request.params.id);
		if (!codemark) {
			throw this.errorHandler.error('notFound', { info: 'codemark' });
		}
		if (codemark.get('creatorId') !== this.user.id) {
			throw this.errorHandler.error('updateAuth', { reason: 'only the author can update a codemark' });
		}
	}

	// after the codemark is updated...
	async postProcess () {
		await this.publishCodemark();
	}

	// publish the codemark to the appropriate messager channel(s)
	async publishCodemark () {
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
		description.access = 'Only the creator of a codemark can update it';
		description.input = {
			summary: description.input,
			looksLike: {
				'streamId': '<If specified, updates the stream ID the codemark belongs to>',
				'postId': '<If specified, updates the post ID that points to this codemark>',
				'status': '<Change the status of the codemark>',
				'color': '<Change the color of the codemark>',
				'text': '<Change the text of the codemark>',
				'title': '<Change the title of the codemark>',
				'assignees': '<Change the array of IDs representing assignees (to issues)>'
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

module.exports = PutCodemarkRequest;
