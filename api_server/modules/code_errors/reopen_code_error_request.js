// handle the PUT /code-errors/reopen/:id request to reopen a resolved code error

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const CodeErrorPublisher = require('./code_error_publisher');

class ReopenCodeErrorRequest extends RestfulRequest {

	// authorize the request for the current user
	async authorize () {
		const codeErrorId = this.request.params.id.toLowerCase();
		this.codeError = await this.user.authorizeCodeError(codeErrorId, this);
		if (!this.codeError) {
			throw this.errorHandler.error('updateAuth', { reason: 'user is not authorized to reopen this code error' });
		}
	}

	// process the request...
	async process () {
		const now = Date.now();

		const op = {
			$set: {
				modifiedAt: now,
				status: 'open'
			},
			$unset: {
				[`resolvedBy.${this.user.id}`]: true,
				resolvedAt: true
			}
		};

		this.updateOp = await new ModelSaver({
			request: this.request,
			collection: this.data.codeErrors,
			id: this.codeError.id
		}).save(op);
	}

	async handleResponse () {
		if (this.gotError) {
			return await super.handleResponse();
		}
		this.responseData = { codeError: this.updateOp };
		await super.handleResponse();
	}

	// after the response has been returned...
	async postProcess () {
		new CodeErrorPublisher({
			codeError: this.codeError,
			request: this,
			data: this.responseData
		}).publishCodeError();
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'reopen',
			summary: 'Reopen a code error',
			access: 'User must be a member of the team that owns the code error.',
			description: 'Reopen the code error specified by setting status to "open".',
			input: 'Specify the code error ID in the request path',
			returns: {
				summary: 'A code error, with directives indicating how to update the code error',
				looksLike: {
					codeError: '<some directive>'
				}
			},
			publishes: 'The response data will be published on the team channel for the team that owns the code errors',
			errors: [
				'updateAuth',
				'notFound'
			]
		};
	}
}

module.exports = ReopenCodeErrorRequest;
