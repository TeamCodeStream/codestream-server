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

		// in the most general case, the author can edit anything they want about a code error
		if (this.codeError.get('creatorId') === this.user.id) {
			return;
		}

		// the rest can only be done by other members of the team
		if (!this.user.hasTeam(this.codeError.get('teamId'))) {
			throw this.errorHandler.error('updateAuth', { reason: 'user must be on the team that owns the code error' });
		}

		// team members can only change a code error's status
		if (Object.keys(this.request.body).find(attribute => {
			return ['status'].indexOf(attribute) === -1;
		})) {
			throw this.errorHandler.error('updateAuth', { reason: 'only the creator of the code error can make this update' });
		}
	}

	// handle sending the response
	async handleResponse () {
		if (this.gotError) {
			return await super.handleResponse();
		}

		// need to special case the situation where assignees are being both added and removed,
		// since mongo won't let us do this in a single operation
		await this.updater.handleAddRemove();

		return super.handleResponse();
	}
	
	// after the code error is updated...
	async postProcess () {
		await this.updater.handleAddRemove();
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
