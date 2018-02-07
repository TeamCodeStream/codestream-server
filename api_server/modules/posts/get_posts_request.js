// handle a GET /posts request

'use strict';

var GetManyRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_many_request');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Indexes = require('./indexes');
const StreamIndexes = require(process.env.CS_API_TOP + '/modules/streams/indexes');
const PostErrors = require('./errors.js');
const Stream = require(process.env.CS_API_TOP + '/modules/streams/stream');

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
	'withMarkers',
	'commitHash'
];

class GetPostsRequest extends GetManyRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(PostErrors);
	}

	// authorize the request for the current user
	authorize (callback) {
		if (!this.request.query.teamId) {
			// must have teamId
			return callback(this.errorHandler.error('parameterRequired', { info: 'teamId' }));
		}
		if (!this.request.query.streamId) {
			// for GET /posts?path, can do without streamId, but must have repoId to locate the file
			if (this.request.query.repoId) {
				return this.authorizePath(callback);
			}
			else {
				return callback(this.errorHandler.error('parameterRequired', { info: 'repoId or streamId' }));
			}
		}
		else {
			this.user.authorizeFromTeamIdAndStreamId(
				this.request.query,
				this,
				(error, info) => {
					if (error) { return callback(error); }
					Object.assign(this, info);
					process.nextTick(callback);
				}
			);
		}
	}

	// for a GET /posts with a path specified (no stream ID known), authorize for
	// the given (required) repoId
	authorizePath (callback) {
		if (!this.request.query.path) {
			return callback(this.errorHandler.error('parameterRequired', { info: 'path' }));
		}
		let repoId = decodeURIComponent(this.request.query.repoId);
		return this.user.authorizeRepo(repoId, this, (error, repo) => {
			if (error) { return callback(error); }
			if (!repo) {
				return callback(this.errorHandler.error('readAuth'));
			}
			let teamId = this.request.query.teamId.toLowerCase();
			if (repo.get('teamId') !== teamId) { // specified teamId must match the team owning the repo!
				return callback(this.errorHandler.error('notFound', { info: 'repo' }));
			}
			return callback();
		});
	}

	// build the query to use for fetching posts (used by the base class GetManyRequest)
	buildQuery () {
		let query = {};
		this.relational = null;
		// process each parameter in turn
		for (let parameter in this.request.query || {}) {
			if (this.request.query.hasOwnProperty(parameter)) {
				let value = decodeURIComponent(this.request.query[parameter]);
				parameter = decodeURIComponent(parameter);
				let error = this.processQueryParameter(parameter, value, query);
				if (error) {
					return error;
				}
			}
		}
		if (Object.keys(query).length === 0) {
			 return null;	// no query parameters, will assume fetch by ID
		}
		return query;
	}

	// process a single incoming query parameter
	processQueryParameter (parameter, value, query) {
		if (BASIC_QUERY_PARAMETERS.indexOf(parameter) !== -1) {
			// basic query parameters go directly into the query (but lowercase)
			query[parameter] = value.toLowerCase();
		}
		else if (parameter === 'ids') {
			// fetch by array of IDs
			let ids = value.split(',');
			query._id = this.data.posts.inQuerySafe(ids);
		}
/*
// Not using these for now, since they will require an index, and I'm not sure of their utility
		else if (parameter === 'newerThan') {
			let newerThan = parseInt(value, 10);
			if (newerThan) {
				query.modifiedAt = { $gt: newerThan };
			}
		}
		else if (parameter === 'mine') {
			query.creatorId = this.user.id;
		}
*/
		else if (parameter === 'seqnum') {
			// fetch by single or range of sequence numbers
			let error = this.processSeqNumParameter(value, query);
			if (error) { return error; }
		}
		else if (parameter === 'path') {
			// for GET /posts?path, we'll have to find the stream first
			this.path = value;
		}
		else if (parameter === 'repoId') {
			// for GET /posts?path, we need to know the repoId
			this.repoId = value.toLowerCase();
		}
		else if (RELATIONAL_PARAMETERS.indexOf(parameter) !== -1) {
			// lt, gt, lte, gte
			let error = this.processRelationalParameter(parameter, value, query);
			if (error) { return error; }
		}
		else if (NON_FILTERING_PARAMETERS.indexOf(parameter) === -1) {
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
		let range = value.split('-');
		let start = parseInt(range[0] || '', 10);
		if (isNaN(start)) {
			return 'invalid sequence number: ' + (range[0] || '');
		}
		let end = parseInt(range[1] || range[0], 10);
		if (isNaN(end)) {
			return 'invalid sequence number: ' + (range[1] || range[0]);
		}
		this.bySeqNum = true;
		query.seqNum = { $gte: start, $lte: end };
	}

	// process a relational parameter (lt, gt, lte, gte) ... for fetching in pages
	processRelationalParameter (parameter, value, query) {
		if (this.relational) {
			return 'only one relational parameter allowed';
		}
		else if (this.bySeqNum) {
			return 'can not query sequence numbers with a relational';
		}
		this.relational = parameter;
		query._id = {};
		let id = this.data.posts.objectIdSafe(value);
		if (!id) {
			return 'invalid id: ' + value;
		}
		query._id['$' + parameter] = id;
	}

	// get database options to use in the query
	getQueryOptions () {
		let limit = this.limit = this.setLimit();
		let sort = this.setSort();
		let hint = this.setHint();
		return {
			databaseOptions: { limit, sort, hint }
		};
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
		else if (this.request.query.seqnum) {
			return Indexes.bySeqNum;
		}
		else {
			return Indexes.byId;
		}
	}

	// called right before the fetch query is run
	preFetchHook (callback) {
		if (!this.path) {
			return callback();
		}
		// for GET /posts?path, we need to find a stream matching the path first
		this.fetchStreamByPath(callback);
	}

	// fetch the stream indicated by the passed path, for GET /posts?path type queries
	fetchStreamByPath (callback) {
		let query = {
			teamId: this.request.query.teamId.toLowerCase(),
			repoId: this.repoId,
			file: this.path
		};
		this.data.streams.getByQuery(
			query,
			(error, streams) => {
				if (error) { return callback(error); }
				if (streams.length === 0) {
					return callback(this.errorHandler.error('notFound', { info: 'stream' }));
				}
				this.fetchedStream = new Stream(streams[0]);
				this.queryAndOptions.query.streamId = streams[0]._id;
				callback();
			},
			{
				databaseOptions: {
					hint: StreamIndexes.byFile
				},
				noCache: true
			}
		);
	}

	// called right after the posts are fetched
	postFetchHook (callback) {
		if (typeof this.request.query.withMarkers === 'undefined') {
			return callback();
		}
		BoundAsync.series(this, [
			this.extractMarkerIds,
			this.fetchMarkers,
			this.sanitizeMarkers,
			this.fetchMarkerLocations
		], callback);
	}

	// extract the marker IDs from any code blocks in the fetched posts
	extractMarkerIds (callback) {
		this.markerIds = this.models.reduce((markerIdsSoFar, post) => {
			const codeBlockMarkerIds = (post.get('codeBlocks') || []).map(codeBlock => codeBlock.markerId);
			markerIdsSoFar.push(...codeBlockMarkerIds);
			return markerIdsSoFar;
		}, []);
		process.nextTick(callback);
	}

	// get the markers for any of the fetched posts, based on marker IDs already extracted
	fetchMarkers (callback) {
		if (this.markerIds.length === 0) {
			return callback();
		}
		this.data.markers.getByIds(
			this.markerIds,
			(error, markers) => {
				if (error) { return callback(error); }
				this.markers = markers;
				callback();
			}
		);
	}

	// sanitize the fetched markers for return to the client
	sanitizeMarkers (callback) {
		if (this.markerIds.length === 0) {
			return callback();
		}
		this.sanitizeModels(
			this.markers,
			(error, objects) => {
				if (error) { return callback(error); }
				this.responseData.markers = objects;
				callback();
			}
		);
	}

	// get the marker locations for any of the fetched markers, based on marker IDs already extracted
	fetchMarkerLocations (callback) {
		if (this.markerIds.length === 0 || !this.request.query.commitHash) {
			return callback();
		}
		const streamId = decodeURIComponent(this.request.query.streamId || this.queryAndOptions.query.streamId).toLowerCase();
		const commitHash = decodeURIComponent(this.request.query.commitHash).toLowerCase();
		const query = {
//			teamId: teamId,	 // will be needed for sharding, but for now, we'll avoiding an index here
			_id: `${streamId}|${commitHash}`
		};
		this.data.markerLocations.getByQuery(
			query,
			(error, markerLocations) => {
				if (error) { return callback(error); }
				if (markerLocations.length === 0) {
					this.responseData.markerLocations = {};
					return callback();	// no matching marker locations for this commit, we'll just send an empty response
				}
				this.markerLocations = markerLocations[0];
				this.responseData.markerLocations = this.markerLocations.getSanitizedObject();
				callback();
			},
			{
				databaseOptions: {
					hint: { _id: 1 }
				}
			}
		);
	}

	// process the request (overrides base class)
	process (callback) {
		super.process((error) => {
			if (error) { return callback(error); }
			// add the "more" flag as needed, if there are more posts to fetch ...
			// we always fetch one more than the page requested, so we can set that flag
			if (this.responseData.posts.length === this.limit) {
				this.responseData.posts.splice(-1);
				this.responseData.more = true;
			}
			if (this.fetchedStream) {
				this.responseData.stream = this.fetchedStream.getSanitizedObject();
			}
			process.nextTick(callback);
		});
	}
}

module.exports = GetPostsRequest;
