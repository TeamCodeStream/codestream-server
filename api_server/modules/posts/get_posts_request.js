// handle a GET /posts request to fetch several posts

'use strict';

const GetManyRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/get_many_request');
const Indexes = require('./indexes');
const PostErrors = require('./errors.js');
const ArrayUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/array_utilities');

// these parameters essentially get passed verbatim to the query
const BASIC_QUERY_PARAMETERS = [
	'teamId',
	'streamId',
	'parentPostId'
];

// additional options for post fetches
const NON_FILTERING_PARAMETERS = [
	'limit',
	'sort'
];

const RELATIONAL_PARAMETERS = [
	'before',
	'after',
	'inclusive'
];

class GetPostsRequest extends GetManyRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(PostErrors);
	}

	// authorize the request for the current user
	async authorize () {
		const whichParams = ArrayUtilities.intersection(Object.keys(this.request.query), BASIC_QUERY_PARAMETERS);
		if (whichParams.length === 0) {
			throw this.errorHandler.error('parameterRequired', { info: 'one of: ' + BASIC_QUERY_PARAMETERS.join(',') });
		}
		else if (whichParams.length > 1) {
			throw this.errorHandler.error('badQuery', { reason: 'can only query on one of: ' + BASIC_QUERY_PARAMETERS.join(',') });
		}
		const whichParam = whichParams[0];

		if (whichParam === 'teamId') {
			return await this.user.authorizeFromTeamId(
				this.request.query,
				this
			);
		}

		let streamId;
		if (whichParam === 'parentPostId') {
			// fetching replies to a parent post
			const parentPost = await this.data.posts.getById(this.request.query.parentPostId.toLowerCase());
			if (!parentPost) {
				throw this.errorHandler.error('notFound', { info: 'parent post' });
			}
			streamId = parentPost.get('streamId');
		} else if (this.request.query.streamId) {
			streamId = this.request.query.streamId.toLowerCase();
		}

		this.stream = await this.user.authorizeStream(streamId, this);
		if (!this.stream) {
			throw this.errorHandler.error('readAuth', { reason: 'user does not have access to this stream' });
		}
	}

	// build the query to use for fetching posts (used by the base class GetManyRequest)
	buildQuery () {
		const query = {};
		
		// process each parameter in turn
		for (let parameter in this.request.query || {}) {
			const value = decodeURIComponent(this.request.query[parameter]);
			parameter = decodeURIComponent(parameter);
			const error = this.processQueryParameter(parameter, value, query);
			if (error) {
				return error;
			}
		}
		this.handleRelationals(query);
		if (Object.keys(query).length === 0) {
			return null;
		}

		return query;
	}

	// process a single incoming query parameter
	processQueryParameter (parameter, value, query) {
		if (BASIC_QUERY_PARAMETERS.includes(parameter)) {
			// basic query parameters go directly into the query (but lowercase)
			query[parameter] = value.toLowerCase();
			this.byId = parameter !== 'streamId'; // stream-based fetches are on seqNum, others are on id
		}
		else if (parameter === 'ids') {
			// fetch by array of IDs
			const ids = value.split(',');
			query.id = this.data.posts.inQuerySafe(ids);
		}
		else if (RELATIONAL_PARAMETERS.includes(parameter)) {
			// before, after, inclusive
			const error = this.processRelationalParameter(parameter, value, query);
			if (error) { return error; }
		}
		else if (!NON_FILTERING_PARAMETERS.includes(parameter)) {
			// sort, limit
			return 'invalid query parameter: ' + parameter;
		}
	}

	// process a relational parameter for seqnums (before, after, inclusive) ... for fetching in pages by seqnum
	processRelationalParameter (parameter, value) {
		this.relationals = this.relationals || {};
		if (parameter === 'inclusive') {
			this.relationals.inclusive = true;
		}
		else if (this.byId) {
			// sorting by ID, not seqnum, only when not fetching by stream
			this.relationals[parameter] = value;
		} else {
			const seqNum = parseInt(value, 10);
			if (isNaN(seqNum) || seqNum.toString() !== value) {
				return 'invalid seqnum: ' + value;
			}
			this.relationals[parameter] = seqNum;
		}
	}

	// form the collected relationals, for the final query
	handleRelationals (query) {
		if (!this.relationals) { return; }
		const { before, after, inclusive } = this.relationals;
		const queryField = this.byId ? 'id' : 'seqNum';
		const beforeSafe = this.byId ? this.data.posts.objectIdSafe(before) : before;
		const afterSafe = this.byId ? this.data.posts.objectIdSafe(after) : after;
		query[queryField] = {};
		if (before !== undefined) {
			if (inclusive) {
				query[queryField].$lte = beforeSafe;
			}
			else {
				query[queryField].$lt = beforeSafe;
			}
		}
		if (after !== undefined) {
			if (inclusive) {
				query[queryField].$gte = afterSafe;
			}
			else {
				query[queryField].$gt = afterSafe;
			}
		}
	}

	// get database options to use in the query
	getQueryOptions () {
		const limit = this.limit = this.setLimit();
		const sort = this.setSort();
		const hint = this.setHint();
		return { limit, sort, hint };
	}

	// set the limit to use in the fetch query, according to options passed in
	setLimit () {
		// the limit can never be greater than maxPostsPerRequest
		let limit = 0;
		if (this.request.query.limit) {
			limit = decodeURIComponent(this.request.query.limit);
			limit = parseInt(limit, 10);
		}
		limit = limit ?
			Math.min(limit, this.api.config.apiServer.limits.maxPostsPerRequest || 100) :
			this.api.config.apiServer.limits.maxPostsPerRequest;
		limit += 1;	// always look for one more than the client, so we can set the "more" flag
		return limit;
	}

	// set the sort order for the fetch query
	setSort () {
		// posts are sorted in descending order by ID unless otherwise specified
		let sort;
		const sortField = this.byId ? 'id' : 'seqNum';
		if (this.request.query.sort && this.request.query.sort.toLowerCase() === 'asc') {
			sort = { [sortField]: 1 };
		}
		else {
			sort = { [sortField]: -1 };
		}
		return sort;
	}

	// set the indexing hint to use in the fetch query
	setHint () {
		if (this.byId) {
			return Indexes.byTeamId;
		}
		else if (this.request.query.parentPostId) {
			return Indexes.byParentPostId;
		}
		else {
			return Indexes.bySeqNum;
		}
	}

	// process the request (overrides base class)
	async process () {
		await super.process();	// do the usual "get-many" processing
		await this.getCodemarks();	// get associated codemarks, as needed
		await this.getReviews();	// get associated reviews, as needed
		await this.getCodeErrors();	// get associated code errors, as needed
		await this.getMarkers();	// get associated markers, as needed
		await this.getReplies();	// get nested replies, if this is a query for replies

		// add the "more" flag as needed, if there are more posts to fetch ...
		// we always fetch one more than the page requested, so we can set that flag
		if (this.responseData.posts.length === this.limit) {
			this.responseData.posts.splice(-1);
			this.responseData.more = true;
		}
	}

	// get the codemarks associated with the fetched posts, as needed
	async getCodemarks () {
		const codemarkIds = this.models.reduce((codemarkIds, post) => {
			if (post.get('codemarkId')) {
				codemarkIds.push(post.get('codemarkId'));
			}
			return codemarkIds;
		}, []);
		if (codemarkIds.length === 0) {
			return;
		}
		this.codemarks = await this.data.codemarks.getByIds(codemarkIds);
		this.responseData.codemarks = this.codemarks.map(codemark => codemark.getSanitizedObject({ request: this }));
	}

	// get the reviews associated with the fetched posts, as needed
	async getReviews () {
		const reviewIds = this.models.reduce((reviewIds, post) => {
			if (post.get('reviewId')) {
				reviewIds.push(post.get('reviewId'));
			}
			return reviewIds;
		}, []);
		if (reviewIds.length === 0) {
			return;
		}
		this.reviews = await this.data.reviews.getByIds(reviewIds, { excludeFields: ['reviewDiffs', 'checkpointReviewDiffs'] });
		this.responseData.reviews = this.reviews.map(review => review.getSanitizedObject({ request: this }));
	}

	// get the code errors associated with the fetched posts, as needed
	async getCodeErrors () {
		const codeErrorIds = this.models.reduce((codeErrorIds, post) => {
			if (post.get('codeErrorId')) {
				codeErrorIds.push(post.get('codeErrorId'));
			}
			return codeErrorIds;
		}, []);
		if (codeErrorIds.length === 0) {
			return;
		}
		this.codeErrors = await this.data.codeErrors.getByIds(codeErrorIds);
		this.responseData.codeErrors = this.codeErrors.map(codeError => codeError.getSanitizedObject({ request: this }));
	}

	// get the markers associated with the fetched posts, as needed
	async getMarkers () {
		if (!this.codemarks && !this.reviews) { return; }
		const thingsWithMarkers = [...(this.codemarks || []), ...(this.reviews || [])];
		const markerIds = thingsWithMarkers.reduce((markerIds, thing) => {
			markerIds.push(...(thing.get('markerIds') || []));
			return markerIds;
		}, []);
		if (markerIds.length === 0) {
			return;
		}
		const markers = await this.data.markers.getByIds(markerIds);
		this.responseData.markers = markers.map(marker => marker.getSanitizedObject({ request: this }));
	}

	// get nested replies, if this is a query for replies
	async getReplies () {
		// only applies to fetching replies to begin with
		if (!this.request.query.parentPostId) {
			return;
		}
		const postIds = this.responseData.posts.map(post => post.id);
		let replies = await this.data.posts.getByQuery(
			{
				parentPostId: this.data.posts.inQuery(postIds),
				streamId: this.stream.id,
				teamId: this.stream.get('teamId')
			},
			{
				hint: Indexes.byParentPostId
			}
		);
		if (replies.length === 0) { return; }
		this.responseData.posts.push(...replies.map(reply => reply.getSanitizedObject({ request: true })));

		// need to sort them if we found nested replies, since they are promised sorted but 
		// the database layer couldn't sort them since they were fetched separately
		this.responseData.posts.sort((a, b) => {
			if (this.byId) {
				if ((this.request.query.sort || '').toLowerCase() === 'asc') {
					return a.id.localeCompare(b.id);
				}
				else {
					return b.id.localeCompare(a.id);
				}
			}
			else {
				throw 'queries for replies by seqNum are deprecated';
			}
		});
	}

	// describe this route for help
	static describe (module) {
		const description = GetManyRequest.describe(module);
		description.description = 'Returns an array of posts for a given stream (given by stream ID), governed by the query parameters. Posts are fetched in pages of no more than 100 at a time. Posts are fetched in descending order unless otherwise specified by the sort parameter. To fetch in pages, continue to fetch until the "more" flag is not seen in the response, using the lowest sequence number fetched by the previous operation (or highest, if fetching in ascending order) along with the "before" operator (or "after" for ascending order).';
		description.access = 'User must be a member of the stream';
		Object.assign(description.input.looksLike, {
			'teamId*': '<ID of the team that owns the stream for which posts are being fetched>',
			'streamId': '<ID of the stream for which posts are being fetched>',
			'parentPostId': '<Fetch only posts that are replies to the post given by this ID>',
			'sort': '<Posts are sorted in descending order, unless this parameter is given as \'asc\'>',
			'limit': '<Limit the number of posts fetched to this number>',
			'before': '<Fetch posts before this sequence number, including the post with that sequence number if "inclusive" set>',
			'after': '<Fetch posts after this sequence number, including the post with that sequence number if "inclusive" is set>',
			'inclusive': '<If before or after or both are set, indicated to include the reference post in the returned posts>'
		});
		description.returns.summary = 'An array of post objects, plus possible codemark and marker objects, and more flag';
		Object.assign(description.returns.looksLike, {
			posts: '<@@#post objects#codemark@@ fetched>',
			codemarks: '<associated @@#codemark objects#codemark@@>',
			reviews: '<associated @@#review objects#review@@>',
			codeErrors: '<associated @@#codeError objects#code errors@@>',
			markers: '<associated @@#markers#markers@@>',
			more: '<will be set to true if more posts are available, see the description, above>'
		});
		description.errors = description.errors.concat([
			'invalidParameter',
			'notFound'
		]);
		return description;
	}
}

module.exports = GetPostsRequest;
