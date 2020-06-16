// handle the PUT /codemarks/unfollow/:id request to unfollow a codemark

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const CodemarkPublisher = require('./codemark_publisher');

class UnfollowCodemarkRequest extends RestfulRequest {

	// authorize the request for the current user
	async authorize () {
		const codemarkId = this.request.params.id.toLowerCase();
		this.codemark = await this.user.authorizeCodemark(codemarkId, this);
		if (!this.codemark) {
			throw this.errorHandler.error('updateAuth', { reason: 'user is not authorized to unfollow this codemark' });
		}
	}

	// process the request...
	async process () {
		const followerIds = this.codemark.get('followerIds') || [];
		if (followerIds.indexOf(this.user.id) === -1) {
			return;
		}

		const now = Date.now();
		const op = { 
			$pull: { 
				followerIds: this.user.id
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

	// after the response has been returned...
	async postProcess () {
		new CodemarkPublisher({
			codemark: this.codemark,
			request: this,
			data: this.responseData
		}).publishCodemark();
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'unfollow',
			summary: 'Unfollow a codemark',
			access: 'User must be a member of the team that owns the codemark, or if the codemark is within a private channel or DM, user must be a member of that stream.',
			description: 'Remove the current user as a follower of the codemark specified.',
			input: 'Specify the codemark ID in the request path',
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

module.exports = UnfollowCodemarkRequest;
