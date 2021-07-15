// handle the PUT /code-errors/resolve/:id request to resolve a code error

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const CodeErrorPublisher = require('./code_error_publisher');

class ResolveCodeErrorRequest extends RestfulRequest {

	// authorize the request for the current user
	async authorize () {
		const codeErrorId = this.request.params.id.toLowerCase();
		this.codeError = await this.user.authorizeCodeError(codeErrorId, this);
		if (!this.codeError) {
			throw this.errorHandler.error('updateAuth', { reason: 'user is not authorized to resolve this code error' });
		}
	}

	// process the request...
	async process () {
		const now = Date.now();

		const op = {
			$set: {
				status: 'closed',
				resolvedAt: now,
				modifiedAt: now
			}
		};
		const existingResolution = (this.codeError.get('resolvedBy') || {})[this.user.id];
		if (existingResolution) {
			op.$set[`resolvedBy.${this.user.id}.resolvedAt`] = now;
		}
		else {
			op.$set[`resolvedBy.${this.user.id}`] = {
				resolvedAt: now
			};
		}

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
			tag: 'resolve',
			summary: 'Resolve a code error',
			access: 'User must be a member of the team that owns the code error.',
			description: 'Resolve the code error specified, status gets changed to "closed".',
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

module.exports = ResolveCodeErrorRequest;
