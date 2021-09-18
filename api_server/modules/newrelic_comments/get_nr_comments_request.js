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
		await this.getUsers();		// get all associated users

		this.responseData = this.posts.map(post => {
			return Utils.ToNewRelic(this.codeError, post, this.users);
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

	// get all users associated with the replies: all creators, and all mentioned users
	async getUsers () {
		let userIds = this.posts.reduce((accum, post) => {
			accum = [...accum, post.get('creatorId'), ...(post.get('mentionedUserIds') || [])];
			return accum;
		}, []);
		userIds = ArrayUtilities.unique(userIds);

		this.users = await this.data.users.getByIds(userIds);
	}
}

module.exports = GetNRCommentsRequest;
