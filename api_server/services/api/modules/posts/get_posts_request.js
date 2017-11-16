'use strict';

var GetManyRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_many_request');

const BASIC_QUERY_PARAMETERS = [
	'teamId',
	'streamId',
	'creatorId',
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

	authorize (callback) {
		if (!this.request.query.teamId) {
			return callback(this.errorHandler.error('parameterRequired', { info: 'teamId' }));
		}
		if (!this.request.query.streamId) {
			return callback(this.errorHandler.error('parameterRequired', { info: 'streamId' }));
		}
		let teamId = decodeURIComponent(this.request.query.teamId).toLowerCase();
		if (!this.user.hasTeam(teamId)) {
			return callback(this.errorHandler.error('readAuth'));
		}
		let streamId = decodeURIComponent(this.request.query.streamId).toLowerCase();
		this.authorizeStream(teamId, streamId, callback);
	}

	authorizeStream (teamId, streamId, callback) {
		this.data.streams.getById(
			streamId,
			(error, stream) => {
				if (error) { return callback(error); }
				if (!stream || stream.get('teamId') !== teamId) {
					return callback(this.errorHandler.error('notFound', { info: 'stream' }));
				}
				if (
					stream.get('type') !== 'file' &&
					(stream.get('memberIds') || []).indexOf(this.user.id) === -1
				) {
					return callback(this.errorHandler.error('readAuth'));
				}
				return process.nextTick(callback);
			}
		);
	}

	buildQuery () {
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
			ids = ids.map(id => this.data.posts.objectIdSafe(id));
			query._id = { $in: ids };
		}
		else if (parameter === 'newerThan') {
			let newerThan = parseInt(value, 10);
			if (newerThan) {
				query.modifiedAt = { $gt: newerThan };
			}
		}
		else if (parameter === 'mine') {
			query.creatorId = this.user.id;
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
		query._id = {};
		let id = this.data.posts.objectIdSafe(value);
		if (!id) {
			return 'invalid id: ' + value;
		}
		query._id['$' + parameter] = id;
	}

	getQueryOptions () {
		let limit = 0;
		if (this.request.query.limit) {
			limit = decodeURIComponent(this.request.query.limit);
			limit = parseInt(limit, 10);
		}
		this.limit = limit ?
			Math.min(limit, this.api.config.limits.maxPostsPerRequest || 100) :
			this.api.config.limits.maxPostsPerRequest;
		this.limit += 1;
		let sort = { _id: -1 };
		if (this.request.query.sort && this.request.query.sort.toLowerCase() === 'asc') {
			sort = { _id: 1 };
		}
		return {
			databaseOptions: {
				sort: sort,
				limit: this.limit
			}
		};
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
