// handle the "GET /nr-comments" request to fetch multiple New Relic comments associated 
// with a code error

'use strict';

const NRCommentRequest = require('./nr_comment_request');
const Utils = require('./utils');
const CodeErrorIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/code_errors/indexes');
const PostIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/indexes');
const ArrayUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/array_utilities');

class GetNRCommentsRequest extends NRCommentRequest {

	// process the request...
	async process () {
		await this.getCodeError();	// get the requested code error
		await this.getReplies();	// get the replies to the code error
		await this.getMarkers();	// get all markers associated with codemarks as replies
		await this.getUsers();		// get all associated users

		this.responseData = this.posts.map(post => {
			return Utils.ToNewRelic(this.codeError, post, this.codemarksByPost[post.id], this.markersByPost[post.id], this.users);
		});
	}

	// get the requested code error
	async getCodeError () {
		const { objectId, objectType } = this.request.query;
		if (!objectId) {
			throw this.errorHandler.error('parameterRequired', { info: 'objectId' });
		}
		if (!objectType) {
			throw this.errorHandler.error('parameterRequired', { info: 'objectType' });
		}

		this.codeError = await this.data.codeErrors.getOneByQuery(
			{
				objectId,
				objectType 
			},
			{
				hint: CodeErrorIndexes.byObjectId
			}
		);
		if (!this.codeError) {
			throw this.errorHandler.error('notFound', { info: 'codeError' });
		}
		if (this.headerAccountId !== this.codeError.get('accountId')) {
			throw this.errorHandler.error('readAuth', { reason: 'accountId given in the header does not match the object' });
		}
	}

	// get all the replies to the code error
	async getReplies () {
		const postId = this.codeError.get('postId');
		if (!postId) {
				throw this.errorHandler.error('notFound', { info: 'postId' });
		}

		// TODO this should be paginated
		const posts = await this.data.posts.getByQuery(
				{
						teamId: this.codeError.get('teamId'),
						streamId: this.codeError.get('streamId'),
						parentPostId: postId
				},
				{
						hint: PostIndexes.byParentPostId
				}
		);

		// also get posts that are replies to these posts
		const postIds = posts.map(post => post.id);
		const replies = await this.data.posts.getByQuery(
				{
						teamId: this.codeError.get('teamId'),
						streamId: this.codeError.get('streamId'),
						parentPostId: this.data.posts.inQuery(postIds)
				},
				{
						hint: PostIndexes.byParentPostId
				}
		);

		this.posts = [
				...posts,
				...replies
		].sort((a, b) => {
			return b.get('seqNum') - a.get('seqNum');
		});
	}

	// get all markers associated with codemarks as replies
	async getMarkers () {
		this.markersByPost = {};
		this.codemarksByPost = {};
		return Promise.all(this.posts.map(async post => {
			await this.getMarkersForPost(post);
		}));
	}

	// get the markers associated with a given post
	async getMarkersForPost (post) {
		if (!post.get('codemarkId')) { return; }
		const codemark = await this.data.codemarks.getById(post.get('codemarkId'));
		if (!codemark) {
			throw this.errorHandler.error('notFound', { info: 'codemark' });
		}
		const markerIds = codemark.get('markerIds') || [];
		if (markerIds.length > 0) {
			this.markersByPost[post.id] = await this.data.markers.getByIds(markerIds);
		}
		this.codemarksByPost[post.id] = codemark;
	}

	// get all users associated with the replies: all creators, and all mentioned users
	async getUsers () {
		let userIds = this.posts.reduce((accum, post) => {
			const ids = this.getUserIdsByPost(post);
			accum.push.apply(accum, ids);
			return accum;
		}, []);
		userIds = ArrayUtilities.unique(userIds);

		this.users = await this.data.users.getByIds(userIds);
	}
}

module.exports = GetNRCommentsRequest;
