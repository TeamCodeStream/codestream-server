// handle the PUT /unpin-post request to unpin a post from a codemark

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');
const CodemarkPublisher = require('./codemark_publisher');
const Errors = require('./errors');

class UnpinPostRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
	}

	// authorize the request for the current user
	async authorize () {
		const codemarkId = this.request.body.codemarkId;
		if (!codemarkId) {
			throw this.errorHandler.error('parameterRequired', { info: 'codemarkId' });
		}
		this.codemark = await this.user.authorizeCodemark(codemarkId.toLowerCase(), this);
		if (!this.codemark) {
			throw this.errorHandler.error('updateAuth', { reason: 'must be a member of the team or stream' });
		}
	}

	// process the request...
	async process () {
		await this.requireAndAllow();	// require certain parameters, discard unknown parameters
		await this.updateCodemark();	// update the codemark's pinnedReplies
	}

	// require certain parameters, discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['codemarkId', 'postId']
				}
			}
		);
	}

	// update the codemark's pinned replies
	async updateCodemark () {
		let postId = this.request.body.postId;
		if (!this.codemark.get('providerType')) {
			postId = postId.toLowerCase();
		}
		const op = {
			$pull: {
				pinnedReplies: postId
			},
			$set: {
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

	// publish the update to the appropriate messager channel(s)
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
			tag: 'unpin-post',
			summary: 'Unpin a post from a codemark',
			access: 'User must be a member of the stream (for channel and direct streams), or of the team (for team-streams and third-party streams).',
			description: 'Unpin a post from a codemark',
			input: {
				summary: 'Specify the codemark ID and the post ID in the request body',
				looksLike: {
					'codemarkId*': '<ID of the @@#codemark#codemark@@>',
					'postId*': '<ID of the @@post#post@@> to unpin'
				}
			},
			returns: 'A codemark object, with a directive indicating how to update the codemarks\'s pinnedReplies attribute',
			publishes: 'The response data will be published on the stream channel for the stream, or on the team channel for team-streams or third-party streams',
			errors: [
				'updateAuth',
				'notFound'
			]
		};
	}
}

module.exports = UnpinPostRequest;
