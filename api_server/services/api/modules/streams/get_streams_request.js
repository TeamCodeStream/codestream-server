'use strict';

var GetManyRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_many_request');
const STREAM_TYPES = require('./stream_types');

const BASIC_QUERY_PARAMETERS = [
	'teamId',
	'repoId',
	'type',
	'ids'
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

class GetStreamsRequest extends GetManyRequest {

	authorize (callback) {
		if (!this.request.query.teamId) {
			return callback(this.errorHandler.error('parameterRequired', { info: 'teamId' }));
		}
		let teamId = decodeURIComponent(this.request.query.teamId).toLowerCase();
		if (!this.user.hasTeam(teamId)) {
			return callback(this.errorHandler.error('readAuth'));
		}
		return process.nextTick(callback);
	}

	buildQuery () {
		let query = this.formQueryFromParameters();
		if (query === false) {
			// query returns nothing
			return false;
		}
		else if (typeof query !== 'object') {
			return query;
		}
		return this.checkValidQuery(query);
	}

	formQueryFromParameters () {
		let query = {};
		this.haveRelational = false;
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

	getQueryOptions () {
		let limit = 0;
		if (this.request.query.limit) {
			limit = decodeURIComponent(this.request.query.limit);
			limit = parseInt(limit, 10);
		}
		this.limit = limit ?
			Math.min(limit, this.api.config.limits.maxStreamsPerRequest || 100) :
			this.api.config.limits.maxStreamsPerRequest;
		this.limit += 1;
		let sort = { sortId: -1 };
		if (this.request.query.sort && this.request.query.sort.toLowerCase() === 'asc') {
			sort = { sortId: 1 };
		}
		return {
			databaseOptions: {
				sort: sort,
				limit: this.limit
			}
		};
	}

	checkValidQuery (query) {
		if (!query.teamId) {
			return 'teamId required';
		}
		if (query.type && STREAM_TYPES.indexOf(query.type) === -1) {
			return `invalid stream type: ${query.type}`;
		}
		if (query.type && query.type === 'file') {
			if (!query.repoId) {
				return 'queries for file streams require repoId';
			}
		}
		else if (query.type) {
			delete query.repoId;
		}
		if (!query.repoId) {
			query.memberIds = this.user.id;
		}
		return query;
	}

	processQueryParameter (parameter, value, query) {
		if (BASIC_QUERY_PARAMETERS.indexOf(parameter) !== -1) {
			if (parameter === 'ids') {
				let ids = value.split(',');
				ids = ids.map(id => this.data.streams.objectIdSafe(id));
				query._id = { $in: ids };
			}
			else {
				query[parameter] = value;
			}
		}
		else if (parameter === 'unread') {
			let ids = Object.keys(this.user.get('lastReads') || {});
			if (ids.length === 0) {
				// no unreads
				return false;
			}
			else {
				ids = ids.map(id => this.data.streams.objectIdSafe(id));
				query._id = { $in: ids };
			}
		}
		else if (RELATIONAL_PARAMETERS.indexOf(parameter) !== -1) {
			let error = this.processRelationalParameter(parameter, value, query);
			if (error) { return error; }
		}
		else if (NON_FILTERING_PARAMETERS.indexOf(parameter) === -1) {
			return 'invalid query parameter: ' + parameter;
		}
	}

	processRelationalParameter (parameter, value, query) {
		if (this.haveRelational) {
			return 'only one relational parameter allowed';
		}
		this.haveRelational = true;
		query.sortId = {
			['$' + parameter]: value
		};
	}

	process (callback) {
		super.process((error) => {
			if (error) { return callback(error); }
			if (this.responseData.streams.length === this.limit) {
				this.responseData.streams.splice(-1);
				this.responseData.more = true;
			}
			process.nextTick(callback);
		});
	}
}

module.exports = GetStreamsRequest;
