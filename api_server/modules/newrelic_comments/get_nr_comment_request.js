// handle a GET /nr-comments/:id request to fetch a single New Relic comment

'use strict';

const NRCommentRequest = require('./nr_comment_request');
const Utils = require('./utils');

class GetNRCommentRequest extends NRCommentRequest {

	async process () {
		await this.getPost(); 			// get the requested post
		await this.getParentPost();		// get the parent post
		await this.getCodeError();		// get the associated code error
		await this.getUsers();			// get the associated users

		this.responseData = {
			post: Utils.ToNewRelic(this.codeError, this.post, this.users)
		};
	}

	// get the requested post
	async getPost () {
		const postId = this.request.params.id.toLowerCase();
		this.post = await this.data.posts.getById(postId);
		if (!this.post) {
			throw this.errorHandler.error('notFound', { info: 'post' });
		}
	}

	// get the parent post to the requested post, it is assumed the fetched post is a reply to
	// a post pointing to a code error
	async getParentPost () {
		const parentPostId = this.post.get('parentPostId');
		if (!parentPostId) {
			throw this.errorHandler.error('readAuth', { reason: 'unable to fetch non-child post' });
		}
		this.parentPost = await this.data.posts.getById(parentPostId);
		if (!this.parentPost) {
			throw this.errorHandler.error('notFound', { info: 'parent post' });
		}
	}

	// get the code error pointed to by the parent post
	async getCodeError () {
		const objectId = this.parentPost.get('codeErrorId');
		if (!objectId) {
			throw this.errorHandler.error('readAuth', { reason: 'parent is not a code error' });
		}
		this.codeError = await this.data.codeErrors.getById(objectId);
		if (!this.codeError) {
			throw this.errorHandler.error('notFound', { info: 'code error '});
		}
	}

	// get all users associated with the post, either the creator or those mentioned
	async getUsers () {
		const userIds = [this.post.get('creatorId'), ...(this.post.get('mentionedUserIds') || [])];
		this.users = await this.data.users.getByIds(userIds);
	}
}

module.exports = GetNRCommentRequest;
