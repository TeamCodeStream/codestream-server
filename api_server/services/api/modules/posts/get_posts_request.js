'use strict';

var GetManyRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_many_request');
const Indexes = require('./indexes');
const PostErrors = require('./errors.js');

const BASIC_QUERY_PARAMETERS = [
	'teamId',
	'streamId',
	'parentPostId'
];

const RELATIONAL_PARAMETERS = [
	'lt',
	'gt',
	'lte',
	'gte'
];

const NON_FILTERING_PARAMETERS = [
	'limit',
	'sort'
];

class GetPostsRequest extends GetManyRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(PostErrors);
	}

	authorize (callback) {
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

	buildQuery () {
		let query = {};
		this.relational = null;
		for (let parameter in this.request.query || {}) {
			if (this.request.query.hasOwnProperty(parameter)) {
				let value = decodeURIComponent(this.request.query[parameter]).toLowerCase();
				parameter = decodeURIComponent(parameter);
				let error = this.processQueryParameter(parameter, value, query);
				if (error) {
					return error;
				}
			}
		}
		if (Object.keys(query).length === 0) {
			 return null;
		}
		return query;
	}

	processQueryParameter (parameter, value, query) {
		if (BASIC_QUERY_PARAMETERS.indexOf(parameter) !== -1) {
			query[parameter] = value;
		}
		else if (parameter === 'ids') {
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
			let error = this.processSeqNumParameter(value, query);
			if (error) { return error; }
		}
		else if (RELATIONAL_PARAMETERS.indexOf(parameter) !== -1) {
			let error = this.processRelationalParameter(parameter, value, query);
			if (error) { return error; }
		}
		else if (NON_FILTERING_PARAMETERS.indexOf(parameter) === -1) {
			return 'invalid query parameter: ' + parameter;
		}
	}

	processSeqNumParameter (value, query) {
		if (this.relational) {
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

	getQueryOptions () {
		let limit = this.limit = this.setLimit();
		let sort = this.setSort();
		let hint = this.setHint();
		return {
			databaseOptions: { limit, sort, hint }
		};
	}

	setLimit () {
		let limit = 0;
		if (this.request.query.limit) {
			limit = decodeURIComponent(this.request.query.limit);
			limit = parseInt(limit, 10);
		}
		limit = limit ?
			Math.min(limit, this.api.config.limits.maxPostsPerRequest || 100) :
			this.api.config.limits.maxPostsPerRequest;
		limit += 1;
		return limit;
	}

	setSort () {
		let sort = { _id: -1 };
		if (this.request.query.sort && this.request.query.sort.toLowerCase() === 'asc') {
			sort = { _id: 1 };
		}
		else if (this.bySeqNum) {
			sort = { seqNum: 1 };
		}
		return sort;
	}

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

	process (callback) {
		super.process((error) => {
			if (error) { return callback(error); }
			if (this.responseData.posts.length === this.limit) {
				this.responseData.posts.splice(-1);
				this.responseData.more = true;
			}
			process.nextTick(callback);
		});
	}
}

module.exports = GetPostsRequest;
