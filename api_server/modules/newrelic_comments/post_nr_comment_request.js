// fulfill a request to create a New Relic comment

'use strict';

const NRCommentRequest = require('./nr_comment_request');
const PostCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/post_creator');
const Utils = require('./utils');

class PostNRCommentRequest extends NRCommentRequest {

	// process the request...
	async process () {
		this.users = [];

		// handle which attributes are required and allowed for the request
		await this.requireAllow();

		// handle fetching existing code error, as needed
		await this.checkForExistingCodeError();
		
		// resolve the requesting user, which may involve creating a (faux) user
		await this.resolveUser();

		// create a code error linked to the New Relic object to which the comment is attached
		// for now, this is a "code error" object only
		if (!this.codeError) {
			await this.createCodeError({
				body: this.request.body,
				replyIsComing: true
			});
		}

		// handle any mentions in the post
		await this.handleMentions(this.request.body.mentionedUsers);

		// for replies, validate that they are proper replies to a New Relic object
		await this.validateReply();

		// now create the actual post attached to the object
		await this.createPost();

		// update the team, as needed, to reflect any foreign users added
		await this.updateTeam();
	}

	// handle which attributes are required and allowed for this request
	async requireAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					object: ['creator'],
					number: ['accountId'],
					string: ['objectId', 'objectType', 'text'],
				},
				optional: {
					string: ['parentPostId'],
					'array(object)': ['mentionedUsers'],
					number: ['createdAt', 'modifiedAt']
				}
			}
		);

		if (!Utils.CodeErrorObjectTypes.includes(this.request.body.objectType)) {
			throw this.errorHandler.error('validation', { info: 'objectType is not an accepted code error type' });
		}
	}

	// for replies, validate that they are proper replies to a New Relic object
	async validateReply () {
		// if a reply, the parent post must be a comment for this code error
		if (!this.request.body.parentPostId) { return; }

		let grandparentPost;
		const parentPost = await this.data.posts.getById(this.request.body.parentPostId);
		if (!parentPost) {
			throw this.errorHandler.error('notFound', { info: 'parent post' });
		}
		if (parentPost.get('codeErrorId')) {
			if (parentPost.get('codeErrorId') !== this.codeError.id) {
				throw this.errorHandler.error('replyToImproperPost', { reason: 'the parent post\'s object ID does not match the object referenced in the submitted reply' });
			}
		} else if (parentPost.get('parentPostId')) {
			grandparentPost = await this.data.posts.getById(parentPost.get('parentPostId'));
			if (grandparentPost.get('codeErrorId') !== this.codeError.id) {
				throw this.errorHandler.error('replyToImproperPost', { reason: 'the parent post is a reply to an object that does not match the object referenced in the submitted reply'});
			}
		} else {
			throw this.errorHandler.error('replyToImproperPost', { reason: 'the parent post is not associated with a New Relic object' });
		}
		this.codeErrorPost = grandparentPost || parentPost;
	}

	// create the actual post, as a reply to the post pointing to the code error
	async createPost () {
		const postAttributes = {
			parentPostId: this.request.body.parentPostId || this.codeError.get('postId'),
			streamId: this.codeError.get('streamId'),
			text: this.request.body.text,
			mentionedUserIds: this.mentionedUserIds,
		};
		postAttributes._fromNREngine = true;
		if (this.request.headers['x-cs-newrelic-migration']) {
			postAttributes._forNRMigration = true;
		}
		this.postCreator = new PostCreator({ 
			request: this,
			assumeSeqNum: this.codeErrorWasCreated ? 2 : undefined, // because the actual code error was 1
			dontSendEmail: true,
			users: this.users,
			//allowFromUserId: this.user.id,
			forCommentEngine: true,
			setCreatedAt: this.request.body.createdAt,
			setModifiedAt: this.request.body.modifiedAt
		});

		this.post = await this.postCreator.createPost(postAttributes);
	}

	// handle the response to the request
	async handleResponse () {
		if (this.gotError) {
			return super.handleResponse();
		}
		
		// response data is special data returned to New Relic, so save the "nominal" response data,
		// and use that for the later publish, which goes to registered users following the code error
		this.postResponseData = this.postCreator.makeResponseData({
			transforms: this.transforms,
			initialResponseData: { 
				post: this.post.getSanitizedObject({ request: this })
			}
		});

		// return customized response data to New Relic
		this.responseData = {
			post: Utils.ToNewRelic(this.codeError, this.post, null, [], this.users)
		};

		// optionally return the nominal CodeStream response, for testing
		const secret = this.api.config.sharedSecrets.commentEngine;
		if (this.request.headers['x-cs-want-cs-response'] === secret) {
			this.responseData.codeStreamResponse = this.postResponseData;
			if (this.codeErrorPost) {
				this.responseData.codeStreamResponse.codeErrorPost = this.codeErrorPost.getSanitizedObject({ request: this });
			}
		}

		return super.handleResponse();
	}

	// after the request has been processed and response returned to the client....
	async postProcess () {
		await this.publish();
		
		// restore response data for registered CodeStream users, and use that for publishing
		this.responseData = this.postResponseData;
		return this.postCreator.postCreate();
	}
}

module.exports = PostNRCommentRequest;
