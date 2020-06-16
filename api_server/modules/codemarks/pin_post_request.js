// handle the PUT /pin-post request to pin a post to a codemark

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');
const CodemarkPublisher = require('./codemark_publisher');
const Errors = require('./errors');

class PinPostRequest extends RestfulRequest {

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
		await this.getPost();			// get the post, as needed
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

	// get the post (if using CodeStream channels) 
	async getPost () {
		if (this.codemark.get('providerType') || !this.codemark.get('postId')) {
			return;
		}
		const postId = this.request.body.postId.toLowerCase();
		this.post = await this.data.posts.getById(postId);
		if (!this.post) {
			throw this.errorHandler.error('notFound', { info: 'post' });
		}
		if (!this.post.get('parentPostId') || this.post.get('parentPostId') !== this.codemark.get('postId')) {
			throw this.errorHandler.error('invalidReplyPost');
		}
	}

	// update the codemark's pinned replies
	async updateCodemark () {
		const postId = this.post ? this.post.id : this.request.body.postId;
		const op = {
			$addToSet: {
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
			tag: 'pin-post',
			summary: 'Pin a post to a codemark',
			access: 'User must be a member of the stream (for channel and direct streams), or of the team (for team-streams and third-party streams).',
			description: 'Pin a post to a codemark, for CodeStream channels, the post must already be a reply to the codemark.',
			input: {
				summary: 'Specify the codemark ID and the post ID in the request body',
				looksLike: {
					'codemarkId*': '<ID of the @@#codemark#codemark@@>',
					'postId*': '<ID of the @@post#post@@> to pin'
				}
			},
			returns: 'A codemark object, with a directive indicating how to update the codemarks\'s pinnedReplies attribute',
			publishes: 'The response data will be published on the stream channel for the stream, or on the team channel for team-streams or third-party streams',
			errors: [
				'updateAuth',
				'notFound',
				'invalidReplyPost'
			]
		};
	}
}

module.exports = PinPostRequest;
