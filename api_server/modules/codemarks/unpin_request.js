// handle the PUT /unpin/:id request to unpin a codemark

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const CodemarkPublisher = require('./codemark_publisher');

class UnpinRequest extends RestfulRequest {

	// authorize the request for the current user
	async authorize () {
		this.codemark = await this.user.authorizeCodemark(this.request.params.id, this);
		if (!this.codemark) {
			throw this.errorHandler.error('updateAuth', { reason: 'must be a member of the team' });
		}
	}

	// process the request...
	async process () {
		const op = {
			$set: {
				pinned: false,
				modifiedAt: Date.now()
			}
		};
		this.updateOp = await new ModelSaver({
			request: this,
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

	// after the post is updated...
	async postProcess () {
		await this.publishUpdate();
	}

	// publish the update to the appropriate broadcaster channel(s)
	async publishUpdate () {
		new CodemarkPublisher({
			codemark: this.codemark,
			request: this,
			data: this.responseData
		}).publishCodemark();
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'unpin',
			summary: 'Unpin a codemark',
			access: 'User must be a member of the stream (for channel and direct streams), or of the team (for team-streams and third-party streams).',
			description: 'Unpin a codemark, setting its pinned attribute to false.',
			input: 'Specify the ID of the codemark in the path',
			returns: 'A codemark object, with a directive indicating how to update the codemarks\'s pinned attribute',
			publishes: 'The response data will be published on the stream channel for the stream, or on the team channel for team-streams or third-party streams',
			errors: [
				'updateAuth',
				'notFound'
			]
		};
	}
}

module.exports = UnpinRequest;
