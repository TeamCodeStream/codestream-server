// handle the PUT /codemarks request to edit attributes of an codemark

'use strict';

const PutRequest = require(process.env.CS_API_TOP + '/lib/util/restful/put_request');
const CodemarkPublisher = require('./codemark_publisher');

class PutCodemarkRequest extends PutRequest {

	// authorize the request for the current user
	async authorize () {
		// get the codemark, only the author can edit a codemark
		this.codemark = await this.data.codemarks.getById(this.request.params.id);
		if (!this.codemark) {
			throw this.errorHandler.error('notFound', { info: 'codemark' });
		}
		if (
			this.codemark.get('creatorId') !== this.user.id &&
			!this.isChangeToIssueStatus()	// allow anyone on team to update an issue's status
		) {
			throw this.errorHandler.error('updateAuth', { reason: 'only the author, or a team member changing an issue\'s status, can update a codemark' });
		}
	}

	// if the update is a change to the issue's status, and nothing else, then we allow anyone
	// on the team to do it
	isChangeToIssueStatus () {
		return (
			this.codemark.get('type') === 'issue' &&
			Object.keys(this.request.body).length === 1 &&
			Object.keys(this.request.body)[0] === 'status'
		);
	}

	// handle response to the request
	async handleResponse () {
		if (this.gotError) {
			return await super.handleResponse();
		}
		if (this.transforms.markerUpdates) {
			this.responseData.markers = this.transforms.markerUpdates;
		}
		await super.handleResponse();
	}

	// after the codemark is updated...
	async postProcess () {
		await this.publishCodemark();
	}

	// publish the codemark to the appropriate messager channel(s)
	async publishCodemark () {
		await new CodemarkPublisher({
			codemark: this.codemark,
			request: this,
			data: this.responseData
		}).publishCodemark();
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
			summary: 'Publishes the updated codemark attributes to the team channel for the team that owns the codemark, or to the stream channel if using CodeStream streams',
			looksLike: {
				'codemark': '<@@#codemark object#codemark@@>'
			}
		};
		return description;
	}
}

module.exports = PutCodemarkRequest;
