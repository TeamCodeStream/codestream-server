// handle the PUT /code-errors request to edit attributes of a code error

'use strict';

const PutRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/put_request');
const CodeErrorPublisher = require('./code_error_publisher');

class PutCodeErrorRequest extends PutRequest {

	// authorize the request for the current user
	async authorize () {
		// first get the code error
		const codeErrorId = this.request.params.id.toLowerCase();
		this.codeError = await this.data.codeErrors.getById(codeErrorId);
		if (!this.codeError) {
			throw this.errorHandler.error('notFound', { info: 'code error' });
		}

		// if only updated stackTraces, anyone who is following can update
		if (Object.keys(this.request.body).length === 1 && this.request.body.stackTraces) {
			if (!(this.codeError.get('followerIds') || []).includes(this.user.id)) {
				throw this.errorHandler.error('updateAuth', { reason: 'only a follower of the code error can update the stack traces' });
			}
			return;
		}

		// otherwise only the author can edit a code error
		if (this.codeError.get('creatorId') !== this.user.id) {
			throw this.errorHandler.error('updateAuth', { reason: 'only the creator of the code error can make this update' });
		}
	}

	// after the code error is updated...
	async postProcess () {
		await this.publishCodeError();
	}

	// publish the code error to the appropriate broadcaster channel(s)
	async publishCodeError () {
		await new CodeErrorPublisher({
			codeError: this.codeError,
			request: this,
			data: this.responseData
		}).publishCodeError();
	}

	// describe this route for help
	static describe (module) {
		const description = PutRequest.describe(module);
		description.access = 'Only the creator of a code error can update it, with the exception of status';
		description.input = {
			summary: description.input,
			looksLike: {
				'title': '<Change the title of the code error>',
				'text': '<Change the text of the code error>',
				'status': '<Change the status of the code error>',
				'$push': {
					assignees: '<Array of IDs representing users to add as assignees to the code error>'
				},
				'$pull': {
					assignees: '<Array of IDs representing users to remove as assignees of the code error>'
				}
			}
		};
		description.publishes = {
			summary: 'Publishes the updated code error attributes to the team channel for the team that owns the code error',
			looksLike: {
				'codeError': '<@@#code error object#codeError@@>'
			}
		};
		return description;
	}
}

module.exports = PutCodeErrorRequest;
