// handle a GET /posts request to fetch several posts

'use strict';

const GetManyRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_many_request');
const Indexes = require('./indexes');
const PostErrors = require('./errors.js');

// these parameters essentially get passed verbatim to the query
const BASIC_QUERY_PARAMETERS = [
	'teamId',
	'streamId',
	'parentPostId'
];

// these are used to retrieve posts by ID, in pages
const RELATIONAL_PARAMETERS = [
	'lt',
	'gt',
	'lte',
	'gte'
];

// additional options for post fetches
const NON_FILTERING_PARAMETERS = [
	'limit',
	'sort',
	'commitHash'
];

const SEQNUM_RELATIONAL_PARAMETERS = [
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
		const info = await this.user.authorizeFromTeamIdAndStreamId(
			this.request.query,
			this
		);
		Object.assign(this, info);
	}

	// build the query to use for fetching posts (used by the base class GetManyRequest)
	buildQuery () {
		const query = {};
		this.relational = null;
		// process each parameter in turn
		for (let parameter in this.request.query || {}) {
			if (this.request.query.hasOwnProperty(parameter)) {
				const value = decodeURIComponent(this.request.query[parameter]);
				parameter = decodeURIComponent(parameter);
				const error = this.processQueryParameter(parameter, value, query);
				if (error) {
					return error;
				}
			}
		}
		this.handleSeqNumRelationals(query);
		if (Object.keys(query).length === 0) {
			return null;	// no query parameters, will assume fetch by ID
		}
		return query;
	}

	// process a single incoming query parameter
	processQueryParameter (parameter, value, query) {
		if (BASIC_QUERY_PARAMETERS.includes(parameter)) {
			// basic query parameters go directly into the query (but lowercase)
			query[parameter] = value.toLowerCase();
		}
		else if (parameter === 'ids') {
			// fetch by array of IDs
			const ids = value.split(',');
			query._id = this.data.posts.inQuerySafe(ids);
		}
		else if (parameter === 'seqnum') {
			// fetch by single or range of sequence numbers
			const error = this.processSeqNumParameter(value, query);
			if (error) { return error; }
		}
		else if (RELATIONAL_PARAMETERS.includes(parameter)) {
			// lt, gt, lte, gte
			const error = this.processRelationalParameter(parameter, value, query);
			if (error) { return error; }
		}
		else if (SEQNUM_RELATIONAL_PARAMETERS.includes(parameter)) {
			// before, after, inclusive
			const error = this.processSeqNumRelationalParameter(parameter, value, query);
			if (error) { return error; }
		}
		else if (!NON_FILTERING_PARAMETERS.includes(parameter)) {
			// sort, limit
			return 'invalid query parameter: ' + parameter;
		}
	}

	// process a parameter specifying fetching by sequence number (single or range)
	processSeqNumParameter (value, query) {
		if (this.relational) {
			// relationals are for fetching by ID
			return 'can not query sequence numbers with a relational';
		}
		else if (this.seqNumRelationals) {
			return 'seqNum queries must use seqNum ranges or seqNum relationals but not both';
		}
		const range = value.split('-');
		const seqNums = value.split(',');
		if (range.length > 1 && seqNums.length > 1) {
			return 'can not query for range and individual sequence numbers at the same time';
		}
		this.haveSeqNum = true;
		this.bySeqNum = true;
		if (range.length > 1) {
			return this.processSeqNumRange(range, query);
		}
		else {
			return this.processSeqNums (seqNums, query);
		}
	}

	// process a parameter specifying fetching by a range of sequence numbers
	processSeqNumRange (range, query) {
		const start = parseInt(range[0] || '', 10);
		if (isNaN(start)) {
			return 'invalid sequence number: ' + (range[0] || '');
		}
		const end = parseInt(range[1] || range[0], 10);
		if (isNaN(end)) {
			return 'invalid sequence number: ' + (range[1] || range[0]);
		}
		query.seqNum = { $gte: start, $lte: end };
	}

	// process a parameter specifying fetching individual posts by sequence number
	processSeqNums (seqNums, query) {
		let error;
		if (seqNums.length > 100) {
			return 'too many sequence numbers';
		}
		const properSeqNums = [];
		if (seqNums.find(seqNum => {
			const properSeqNum = parseInt(seqNum, 10);
			if (isNaN(properSeqNum)) {
				error = 'invalid sequence number: ' + (seqNum || '');
				return true;
			}
			properSeqNums.push(properSeqNum);
		})) {
			return error;
		}
		query.seqNum = this.data.posts.inQuery(properSeqNums);
	}

	// process a relational parameter (lt, gt, lte, gte) ... for fetching in pages
	processRelationalParameter (parameter, value, query) {
		if (this.relational) {
			return 'only one relational parameter allowed';
		}
		else if (this.haveSeqNum) {
			return 'can not query sequence numbers with a relational';
		}
		else if (this.seqNumRelationals) {
			return 'cannot use relational parameter with seqNum relationals';
		}
		this.relational = parameter;
		query._id = {};
		const id = this.data.posts.objectIdSafe(value);
		if (!id) {
			return 'invalid id: ' + value;
		}
		query._id['$' + parameter] = id;
	}

	// process a relational parameter for seqnums (before, after, inclusive) ... for fetching in pages by seqnum
	processSeqNumRelationalParameter (parameter, value) {
		if (this.relational) {
			return 'can not use seqnum relationals with other relationals';
		}	
		else if (this.haveSeqNum) {
			return 'seqNum queries must use seqNum ranges or seqNum relationals but not both';
		}
		this.bySeqNum = true;
		this.seqNumRelationals = this.seqNumRelationals || {};
		if (parameter === 'inclusive') {
			this.seqNumRelationals.inclusive = true;
		}
		else {
			const seqNum = parseInt(value, 10);
			if (isNaN(seqNum) || seqNum.toString() !== value) {
				return 'invalid seqnum: ' + value;
			}
			this.seqNumRelationals[parameter] = seqNum;
		}
	}

	// from the collected seqNum relationals, for the final query
	handleSeqNumRelationals (query) {
		if (!this.seqNumRelationals) { return; }
		const { before, after, inclusive } = this.seqNumRelationals;
		query.seqNum = {};
		if (before !== undefined) {
			if (inclusive) {
				query.seqNum.$lte = before;
			}
			else {
				query.seqNum.$lt = before;
			}
		}
		if (after !== undefined) {
			if (inclusive) {
				query.seqNum.$gte = after;
			}
			else {
				query.seqNum.$gt = after;
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
			Math.min(limit, this.api.config.limits.maxPostsPerRequest || 100) :
			this.api.config.limits.maxPostsPerRequest;
		limit += 1;	// always look for one more than the client, so we can set the "more" flag
		return limit;
	}

	// set the sort order for the fetch query
	setSort () {
		// posts are sorted in descending order by ID unless otherwise specified
		let sort = { _id: -1 };
		if (this.request.query.sort && this.request.query.sort.toLowerCase() === 'asc') {
			sort = { _id: 1 };
		}
		else if (this.bySeqNum) {
			sort = { seqNum: 1 };
		}
		return sort;
	}

	// set the indexing hint to use in the fetch query
	setHint () {
		if (this.request.query.parentPostId) {
			return Indexes.byParentPostId;
		}
		else if (this.bySeqNum) {
			return Indexes.bySeqNum;
		}
		else {
			return Indexes.byId;
		}
	}

	// process the request (overrides base class)
	async process () {
		await super.process();	// do the usual "get-many" processing
		await this.getItems();	// get associated items, as needed
		await this.getMarkers();	// get associated markers, as needed

		// add the "more" flag as needed, if there are more posts to fetch ...
		// we always fetch one more than the page requested, so we can set that flag
		if (this.responseData.posts.length === this.limit) {
			this.responseData.posts.splice(-1);
			this.responseData.more = true;
		}
	}

	// get the items associated with the fetched posts, as needed
	async getItems () {
		const itemIds = this.models.reduce((itemIds, post) => {
			if (post.get('itemId')) {
				itemIds.push(post.get('itemId'));
			}
			return itemIds;
		}, []);
		if (itemIds.length === 0) {
			return;
		}
		this.items = await this.data.items.getByIds(itemIds);
		this.responseData.items = this.items.map(item => item.getSanitizedObject());
	}

	// get the markers associated with the fetched posts, as needed
	async getMarkers () {
		if (!this.items) { return; }
		const markerIds = this.items.reduce((markerIds, post) => {
			markerIds.push(...(post.get('markerIds') || []));
			return markerIds;
		}, []);
		if (markerIds.length === 0) {
			return;
		}
		const markers = await this.data.markers.getByIds(markerIds);
		this.responseData.markers = markers.map(marker => marker.getSanitizedObject());
	}

	// describe this route for help
	static describe (module) {
		const description = GetManyRequest.describe(module);
		description.description = 'Returns an array of posts for a given stream (given by stream ID), governed by the query parameters. Posts are fetched in pages of no more than 100 at a time. Posts are fetched in descending order unless otherwise specified by the sort parameter. To fetch in pages, continue to fetch until the "more" flag is not seen in the response, using the lowest ID fetched by the previous operation (or highest, if fetching in ascending order) along with the "lt" operator (or "gt" for ascending order).';
		description.access = 'For posts in a file stream, user must be a member of the team that owns the file stream; for other streams, user must be a member of the stream';
		Object.assign(description.input.looksLike, {
			'teamId*': '<ID of the team that owns the stream for which posts are being fetched>',
			'streamId': '<ID of the stream for which posts are being fetched, required if path is not provided>',
			'repoId': '<ID of the repo to which the file belongs, if path is specified instead of streamId>',
			'path': '<If specified instead of stream ID, look for a file stream for the path and fetch posts for that stream>',
			'parentPostId': '<Fetch only posts that are replies to the post given by this ID>',
			'lt': '<Fetch posts with ID less than the given value>',
			'gt': '<Fetch posts with ID greater than the given value>',
			'lte': '<Fetch posts with ID less than or equal to the given value>',
			'gte': '<Fetch posts with ID greater than or equal to the given value>',
			'sort': '<Posts are sorted in descending order, unless this parameter is given as \'asc\'>',
			'limit': '<Limit the number of posts fetched to this number>',
			'seqnum': '<Fetch the posts in a range of sequence numbers, like: seqnum=3-7 (fetches posts with sequence numbers 3 thru 7, inclusive), or individual sequence numbers like: seqnum=4,6,9>',
			'before': '<Fetch posts before this sequence number, including the post with that sequence number if "inclusive" set>',
			'after': '<Fetch posts after this sequence number, including the post with that sequence number if "inclusive" is set>',
			'inclusive': '<If before or after or both are set, indicated to include the reference post in the returned posts>'
		});
		description.returns.summary = 'An array of post objects, plus possible marker objects and markerLocations object, and more flag';
		Object.assign(description.returns.looksLike, {
			stream: '<@@#stream object#stream@@ > (stream associated with the path, if specified)',
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
