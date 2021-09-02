// handle the "GET /nr-comments" request to fetch multiple New Relic comments associated 
// with an observability object

'use strict';

const NRCommentRequest = require('./nr_comment_request');
const Utils = require('./utils');
const CodeErrorIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/code_errors/indexes');
const PostIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/indexes');
const ArrayUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/array_utilities');

class GetNRCommentsRequest extends NRCommentRequest {

	// process the request...
	async process () {
		await this.getObservabilityObject();	// get the requested observability object
		await this.getReplies();				// get the replies to the observability object
		await this.getUsers();					// get all associated users

		this.responseData = this.posts.map(post => {
			return Utils.ToNewRelic(this.observabilityObject, post, this.users);
		});
	}

	// get the requested observability object
	async getObservabilityObject () {
		const { objectId, objectType } = this.request.query;
		if (!objectId) {
			throw this.errorHandler.error('parameterRequired', { info: 'objectId' });
		}
		if (!objectType) {
			throw this.errorHandler.error('parameterRequired', { info: 'objectType' });
		}

		this.observabilityObject = await this.data.codeErrors.getOneByQuery(
			{
				objectId,
				objectType 
			},
			{
				hint: CodeErrorIndexes.byObjectId
			}
		);
		if (!this.observabilityObject) {
			throw this.errorHandler.error('notFound', { info: 'observabilityObject' });
		}
	}

	// get all the replies to the observability object
	async getReplies () {
		const postId = this.observabilityObject.get('postId');
		if (!postId) {
			throw this.errorHandler.error('notFound', { info: 'postId' });
		}

		// TODO this should be paginated
		this.posts = await this.data.posts.getByQuery(
			{
				teamId: this.observabilityObject.get('teamId'),
				streamId: this.observabilityObject.get('streamId'),
				parentPostId: postId
			},
			{
				hint: PostIndexes.byParentPostId,
				sort: { seqNum: -1 }
			}
		);
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
