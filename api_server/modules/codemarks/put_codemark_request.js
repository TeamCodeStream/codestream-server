// handle the PUT /codemarks request to edit attributes of an codemark

'use strict';

const PutRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/put_request');
const CodemarkPublisher = require('./codemark_publisher');

class PutCodemarkRequest extends PutRequest {

	// authorize the request for the current user
	async authorize () {
		// first get the codemark
		this.codemark = await this.data.codemarks.getById(this.request.params.id);
		if (!this.codemark) {
			throw this.errorHandler.error('notFound', { info: 'codemark' });
		}

		// if linking to a CodeStream post, the user must be the author of the post
		if (typeof this.request.body.postId === 'string' && !this.codemark.get('providerType')) {
			this.post = await this.data.posts.getById(this.request.body.postId.toLowerCase());
			if (!this.post) {
				throw this.errorHandler.error('notFound', { info: 'post' });
			}
			if (this.post.get('creatorId') !== this.user.id) {
				throw this.errorHandler.error('updateAuth', { reason: 'user must be the author of the post being linked' });
			}
		}

		// only issues or change requests can have status change
		if (this.request.body.status && this.codemark.get('type') !== 'issue' && !this.codemark.get('isChangeRequest')) {
			throw this.errorHandler.error('updateAuth', { reason: 'can not change the status of a codemark type that is not an issue or a change request' });
		}

		// in the most general case, the author can edit anything they want about a codemark
		if (this.codemark.get('creatorId') === this.user.id) {
			return;
		}

		// the rest can only be done by other members of the team
		if (!this.user.hasTeam(this.codemark.get('teamId'))) {
			throw this.errorHandler.error('updateAuth', { reason: 'user must be on the team that owns the codemark' });
		}

		// team members can only change an issue's status, or the tags array
		if (Object.keys(this.request.body).find(attribute => {
			return ['tags', 'status'].indexOf(attribute) === -1;
		})) {
			throw this.errorHandler.error('updateAuth', { reason: 'only the creator of the codemark can make this update' });
		}
	}

	// process the request itself...
	async process () {
		this.wantEmailNotification = this.request.body.wantEmailNotification;
		delete this.request.body.wantEmailNotification;
		return super.process();
	}

	// handle response to the request
	async handleResponse () {
		if (this.gotError) {
			return await super.handleResponse();
		}

		// if there are updates to markers, add them to the response
		if (this.transforms.markerUpdates) {
			this.responseData.markers = this.transforms.markerUpdates;
		}

		// if there are other codemarks updated, add them to the response
		if (this.transforms.updatedCodemarks) {
			this.responseData.codemarks = this.transforms.updatedCodemarks;
		}

		// add any updatedPost to the response
		if (this.transforms.postUpdate) {
			this.responseData.post = this.transforms.postUpdate;
		}

		await super.handleResponse();
	}

	// after the codemark is updated...
	async postProcess () {
		await this.publishCodemark();
		if (this.wantEmailNotification) {
			this.sendEmailNotification();
		}
	}

	// publish the codemark to the appropriate broadcaster channel(s)
	async publishCodemark () {
		await new CodemarkPublisher({
			codemark: this.codemark,
			request: this,
			data: this.responseData
		}).publishCodemark();
	}

	// for issue codemarks linked to a third-party provider, we only send the email notification 
	// triggered by the codemark creation when we have the third-party provider info
	sendEmailNotification () {
		const postId = this.updater.codemark.get('postId');
		const message = {
			type: 'notification_v2',
			postId
		};
		this.log(`Triggering V2 email notifications for post ${postId}...`);
		this.api.services.email.queueEmailSend(message, { request: this.request });
	}

	// describe this route for help
	static describe (module) {
		const description = PutRequest.describe(module);
		description.access = 'Only the creator of a codemark can update it, except tags and the status of issues';
		description.input = {
			summary: description.input,
			looksLike: {
				'streamId': '<If specified, updates the stream ID the codemark belongs to>',
				'postId': '<If specified, updates the post ID that points to this codemark>',
				'status': '<Change the status of the codemark>',
				'color': '<Change the color of the codemark>',
				'text': '<Change the text of the codemark>',
				'title': '<Change the title of the codemark>',
				'assignees': '<Change the array of IDs representing assignees (to issues)>',
				'tags': '<Change the array of tags associatd with this codemark>',
				'relatedCodemarkIds': '<Array of IDs that are to be related to this codemark, the link will be made bi-directional>',
			}
		};
		description.publishes = {
			summary: 'Publishes the updated codemark attributes to the team channel for the team that owns the codemark, or to the stream channel if using CodeStream streams',
			looksLike: {
				'codemark': '<@@#codemark object#codemark@@>'
			}
		};
		return description;
	}
}

module.exports = PutCodemarkRequest;
