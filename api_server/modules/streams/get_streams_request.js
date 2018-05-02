// handle a GET /streams request to fetch multiple streams

'use strict';

const GetManyRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_many_request');
const STREAM_TYPES = require('./stream_types');
const Indexes = require('./indexes');

// these parameters essentially get passed verbatim to the query
const BASIC_QUERY_PARAMETERS = [
	'teamId',
	'repoId',
	'type'
];

// these are used to retrieve posts in pages
const RELATIONAL_PARAMETERS = [
	'lt',
	'gt',
	'lte',
	'gte'
];

// additional options for post fetches
const NON_FILTERING_PARAMETERS = [
	'limit',
	'sort'
];

class GetStreamsRequest extends GetManyRequest {

	// authorize the request for the current user
	async authorize () {
		// team ID must be provided, and the user must be a member of the team
		await this.user.authorizeFromTeamId(this.request.query, this);
	}

	// build the query to use for fetching streams (used by the base class GetManyRequest)
	buildQuery () {
		// form the database query
		this.query = this.formQueryFromParameters();
		if (this.query === false) {
			// query returns nothing
			return false;
		}
		else if (typeof this.query !== 'object') {
			// really an error
			return this.query;
		}
		// make sure it's a valid query, subject to certain constraints
		return this.checkValidQuery(this.query);
	}

	// form the database query based on the input parameters
	formQueryFromParameters () {
		let query = {};
		this.haveRelational = false;
		// process each parameter in turn
		for (let parameter in this.request.query || {}) {
			if (this.request.query.hasOwnProperty(parameter)) {
				let value = decodeURIComponent(this.request.query[parameter]).toLowerCase();
				parameter = decodeURIComponent(parameter);
				let error = this.processQueryParameter(parameter, value, query);
				if (error) {
					return error;
				}
				else if (error === false) {
					// query returns nothing
					return false;
				}
			}
		}
		return query;
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
		// the limit can never be greater than maxStreamsPerRequest
		let limit = 0;
		if (this.request.query.limit) {
			limit = decodeURIComponent(this.request.query.limit);
			limit = parseInt(limit, 10);
		}
		limit = limit ?
			Math.min(limit, this.api.config.limits.maxStreamsPerRequest || 100) :
			this.api.config.limits.maxStreamsPerRequest;
		limit += 1; // always look for one more than the client, so we can set the "more" flag
		return limit;
	}

	// set the sort order for the fetch query
	setSort () {
		// streams are sorted in descending order by sortId (which is either the ID of the most recent post
		// or the ID of the stream if it has no posts) unless otherwise specified
		let sort = { sortId: -1 };
		if (this.request.query.sort && this.request.query.sort.toLowerCase() === 'asc') {
			sort = { sortId: 1 };
		}
		return sort;
	}

	// set the indexing hint to use in the fetch query
	setHint () {
		if (this.query.type === 'file') {
			return Indexes.byFile;
		}
		else {
			return Indexes.byMembers;
		}
	}

	// check that the database query is valid according to certain constraints
	checkValidQuery (query) {
		if (!query.teamId) {
			return 'teamId required';
		}
		if (query.type && !STREAM_TYPES.includes(query.type)) {
			return `invalid stream type: ${query.type}`;
		}
		if (query.type && query.type === 'file') {
			if (!query.repoId) {
				return 'queries for file streams require repoId';
			}
		}
		else if (query.type) {
			delete query.repoId;	// for non file-type, ignore the repo ID
		}
		if (!query.repoId) {
			// for non file-type, only return streams which have the requesting user as a member,
			// or public streams, which the user can see, even if they can't see content
			// (this will include any "team streams")
			query.$or = [
				{
					memberIds: this.user.id
				},
				{
					type: 'channel',
					privacy: 'public'
				}
			];
		}
		return query;
	}

	// process a single incoming query parameter
	processQueryParameter (parameter, value, query) {
		if (BASIC_QUERY_PARAMETERS.includes(parameter)) {
			// basic query parameters go directly into the query
			query[parameter] = value;
		}
		else if (parameter === 'ids') {
			// fetch by array of IDs
			let ids = value.split(',');
			query._id = this.data.streams.inQuerySafe(ids);
		}
		else if (parameter === 'unread') {
			// fetch streams in which there are unread messages for this user
			let ids = Object.keys(this.user.get('lastReads') || {});
			if (ids.length === 0) {
				// no unreads
				return false;
			}
			else {
				query._id = this.data.streams.inQuerySafe(ids);
			}
		}
		else if (RELATIONAL_PARAMETERS.includes(parameter)) {
			// lt, gt, lte, gte
			let error = this.processRelationalParameter(parameter, value, query);
			if (error) { return error; }
		}
		else if (!NON_FILTERING_PARAMETERS.includes(parameter)) {
			// sort, limit
			return 'invalid query parameter: ' + parameter;
		}
	}

	// process a relational parameter (lt, gt, lte, gte) ... for fetching in pages by sortId
	processRelationalParameter (parameter, value, query) {
		if (this.haveRelational) {
			return 'only one relational parameter allowed';
		}
		this.haveRelational = true;
		query.sortId = {
			['$' + parameter]: value
		};
	}

	// process the request (overrides base class)
	async process () {
		await super.process();
		// add the "more" flag as needed, if there are more streams to fetch ...
		// we always fetch one more than the page requested, so we can set that flag
		if (this.responseData.streams.length === this.limit) {
			this.responseData.streams.splice(-1);
			this.responseData.more = true;
		}
	}
}

module.exports = GetStreamsRequest;
