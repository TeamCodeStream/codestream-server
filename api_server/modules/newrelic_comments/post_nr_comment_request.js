// fulfill a request to create a New Relic comment

'use strict';

const NRCommentRequest = require('./nr_comment_request');
const PostCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/post_creator');
const CodeErrorIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/code_errors/indexes');
const Utils = require('./utils');

class PostNRCommentRequest extends NRCommentRequest {

	// process the request...
	async process () {
		this.users = [];

		// handle which attributes are required and allowed for the request
		await this.requireAllow();

		// get the existing observablity object for this comment, if any
		const { objectId, objectType } = this.request.body;
		this.codeError = await this.data.codeErrors.getOneByQuery(
			{ objectId, objectType },
			{ hint: CodeErrorIndexes.byObjectId }
		);
		if (this.codeError && this.headerAccountId !== this.codeError.get('accountId')) {
			throw this.errorHandler.error('createAuth', { reason: 'accountId given in the header does not match the object' });
		}
		if (this.codeError && this.codeError.get('accountId') !== this.request.body.accountId) {
			throw this.errorHandler.error('createAuth', { reason: 'accountId for the comment does not match the accountId of the parent object' });
		}
		if (!this.codeError && this.request.body.accountId !== this.headerAccountId) {
			throw this.errorHandler.error('createAuth', { reason: 'accountId given in the header does not match that given in the body' });
		}

		// resolve the requesting user, which may involve creating a (faux) user
		await this.resolveUser();

		// create a code error linked to the New Relic object to which the comment is attached
		// for now, this is a "code error" object only
		if (!this.codeError) {
			await this.createCodeError();
		}

		// handle any mentions in the post
		await this.handleMentions(this.request.body.mentionedUsers);

		// for replies, validate that they are proper replies to a New Relic object
		await this.validateReply();

		// now create the actual post attached to the object
		await this.createPost();
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
					'array(object)': ['mentionedUsers']
				}
			}
		);

		if (!Utils.CodeErrorObjectTypes.includes(this.request.body.objectType)) {
			throw this.errorHandler.error('validation', { info: 'objectType is not an accepted code error type' });
		}
	}


	// resolve the requesting user, which may involve creating a (faux) user
	async resolveUser () {
		// find or create a "faux" user, as needed
		this.user = this.request.user = await this.findOrCreateUser(this.request.body.creator);
		this.users.push(this.user);
	}

	// create a code error linked to the New Relic object to which the comment is attached
	async createCodeError () {
		// now create a post in the stream, along with the code error,
		// this will also create a stream for the code error
		this.codeErrorPost = await new PostCreator({
			request: this,
			assumeSeqNum: 1,
			replyIsComing: true,

			users: this.users
		}).createPost({
			dontSendEmail: true,
			codeError: {
				objectId: this.request.body.objectId,
				objectType: this.request.body.objectType,
				accountId: this.request.body.accountId
			}
		});
		this.codeError = this.transforms.createdCodeError;
		this.stream = this.transforms.createdStreamForCodeError;
		this.codeErrorWasCreated = true;
	}

	// for replies, validate that they are proper replies to a New Relic object
	async validateReply () {
		// if a reply, the parent post must be a comment for this code error
		if (!this.request.body.parentPostId) { return; }

		const parentPost = await this.data.posts.getById(this.request.body.parentPostId);
		if (!parentPost) {
			throw this.errorHandler.error('notFound', { info: 'parent post' });
		}
		if (parentPost.get('codeErrorId')) {
			if (parentPost.get('codeErrorId') !== this.codeError.id) {
				throw this.errorHandler.error('replyToImproperPost', { reason: 'the parent post\'s object ID does not match the object referenced in the submitted reply' });
			}
		} else if (parentPost.get('parentPostId')) {
			const grandparentPost = await this.data.posts.getById(parentPost.get('parentPostId'));
			if (grandparentPost.get('codeErrorId') !== this.codeError.id) {
				throw this.errorHandler.error('replyToImproperPost', { reason: 'the parent post is a reply to an object that does not match the object referenced in the submitted reply'});
			}
		} else {
			throw this.errorHandler.error('replyToImproperPost', { reason: 'the parent post is not associated with a New Relic object' });
		}
	}

	// create the actual post, as a reply to the post pointing to the code error
	async createPost () {
		this.postCreator = new PostCreator({ 
			request: this,
			assumeSeqNum: this.codeErrorWasCreated ? 2 : undefined, // because the actual code error was 1
			dontSendEmail: true,
			users: this.users,
			allowFromUserId: this.user.id
		});

		this.post = await this.postCreator.createPost({
			parentPostId: this.request.body.parentPostId || this.codeError.get('postId'),
			streamId: this.codeError.get('streamId'),
			text: this.request.body.text,
			mentionedUserIds: this.mentionedUserIds,
		});
	}

	// handle the response to the request
	async handleResponse () {
		if (this.gotError) {
			return super.handleResponse();
		}
		
		// return customized response data to New Relic
		const secret = this.api.config.sharedSecrets.commentEngine;
		const includeCodeErrorId = this.request.headers['x-cs-want-code-error-id'] === secret;
		this.responseData = {
			post: Utils.ToNewRelic(this.codeError, this.post, null, [], this.users, { includeCodeErrorId })
		};
		return super.handleResponse();
	}

	// after the request has been processed and response returned to the client....
	async postProcess () {
		/*
		await this.postCreator.postCreate();
		await this.publish();		
		*/
	}
}

module.exports = PostNRCommentRequest;
