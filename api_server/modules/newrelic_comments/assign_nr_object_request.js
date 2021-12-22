// fulfill a request to assign someone to a New Relic object

'use strict';

const NRCommentRequest = require('./nr_comment_request');
const Utils = require('./utils');

class AssignNRObjectRequest extends NRCommentRequest {

	// process the request...
	async process () {
		this.users = [];

		// handle which attributes are required and allowed for the request
		await this.requireAllow();

		// handle fetching existing code error, as needed
		await this.checkForExistingCodeError();
				
		// resolve the requesting user, which may involve creating a (faux) user
		await this.resolveUser();

		// resolve the assignee, which may involve creating a (faux) user
		// this user will be added as a "foreign" user if the code error is owned by a team
		this.assignee = await this.findOrCreateUser(this.request.body.assignee, 'assignee.email');
		this.mentionedUserIds = [this.assignee.id]; // by virtue of this, assignee will be added as a "foreign" user to the team
		this.users.push(this.assignee);

		// create a code error linked to the New Relic object to which the comment is attached
		// for now, this is a "code error" object only
		if (!this.codeError) {
			await this.createCodeError({
				body: this.request.body
			});
		}

		// update the team, as needed, to reflect any foreign users added
		await this.updateTeam();
	}

	// handle which attributes are required and allowed for this request
	async requireAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					object: ['creator', 'assignee'],
					number: ['accountId'],
					string: ['objectId', 'objectType'],
				}
			}
		);

		if (!Utils.CodeErrorObjectTypes.includes(this.request.body.objectType)) {
			throw this.errorHandler.error('validation', { info: 'objectType is not an accepted code error type' });
		}
	}

	// handle the response to the request
	async handleResponse () {
		if (this.gotError) {
			return super.handleResponse();
		}
		
		// return empty response to New Relic
		this.responseData = {};

		// optionally return the nominal CodeStream response, for testing
		const secret = this.api.config.sharedSecrets.commentEngine;
		if (this.request.headers['x-cs-want-cs-response'] === secret) {
			if (this.codeErrorWasCreated) {
				this.responseData.codeStreamResponse = {
					codeError: this.codeError.getSanitizedObject({ request: this }),
					post: this.codeErrorPost.getSanitizedObject({ request: this }),
					stream: this.stream.getSanitizedObject({ request: this })
				};
			} else {
				this.responseData.codeStreamResponse = {};
			}
			this.responseData.codeStreamResponse.assigneeId = this.assignee.id;
		}

		return super.handleResponse();
	}

	// after the request has been processed and response returned to the client....
	async postProcess () {
		await this.publish();
		await this.triggerEmailNotification();
	}
	
	// trigger email notification to the assignee
	async triggerEmailNotification () {
		const message = {
			type: 'nr_error_group_assignment',
			codeErrorId: this.codeError.id,
			assignee: this.assignee.id
		};
		this.log(`Triggering email notification for New Relic error group assignment, code error ${this.codeError.id}...`);
		this.api.services.email.queueEmailSend(message, { request: this, user: this.user });
	}
}

module.exports = AssignNRObjectRequest;
