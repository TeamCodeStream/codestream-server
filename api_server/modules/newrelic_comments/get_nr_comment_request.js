// handle a GET /nr-comments/:id request to fetch a single New Relic comment

'use strict';

const NRCommentRequest = require('./nr_comment_request');
const Utils = require('./utils');

class GetNRCommentRequest extends NRCommentRequest {

	async process () {
		await this.getPost(); 			// get the requested post
		await this.getParentPost();		// get the parent post
		await this.getCodeError();		// get the associated code error
		await this.getMarkers();		// for codemarks, get the associated markers
		await this.getUsers();			// get the associated users

		this.responseData = {
			post: Utils.ToNewRelic(this.codeError, this.post, this.codemark, this.markers, this.users)
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
	// a post pointing to a code error, or a reply to a reply to a post that is pointing to a code error
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
		if (this.parentPost.get('parentPostId')) {
			this.grandparentPost = await this.data.posts.getById(this.parentPost.get('parentPostId'));
			if (!this.grandparentPost) {
				throw this.errorHandler.error('notFound', { info: 'grandparent post' });
			}
		}

		const objectId = this.grandparentPost ? this.grandparentPost.get('codeErrorId') : this.parentPost.get('codeErrorId');
		if (!objectId) {
			throw this.errorHandler.error('readAuth', { reason: 'parent or grandparent is not a code error' });
		}
		this.codeError = await this.data.codeErrors.getById(objectId);
		if (!this.codeError) {
			throw this.errorHandler.error('notFound', { info: 'code error '});
		}
		if (this.codeError.get('accountId') !== this.headerAccountId) {
			throw this.errorHandler.error('readAuth', { reason: 'accountId given in the header does not match the object' });
		}
	}

	// get all the users associated with this comment
	async getUsers () {
		this.users = await this.getUsersByPost(this.post);
	}
}

module.exports = GetNRCommentRequest;
