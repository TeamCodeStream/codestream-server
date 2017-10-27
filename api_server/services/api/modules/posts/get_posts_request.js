'use strict';

var Get_Many_Request = require(process.env.CS_API_TOP + '/lib/util/restful/get_many_request');

const BASIC_QUERY_PARAMETERS = [
	'team_id',
	'stream_id',
	'creator_id',
	'parent_post_id'
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

class Get_Posts_Request extends Get_Many_Request {

	authorize (callback) {
		if (!this.request.query.team_id) {
			return callback(this.error_handler.error('parameter_required', { info: 'team_id' }));
		}
		if (!this.request.query.stream_id) {
			return callback(this.error_handler.error('parameter_required', { info: 'stream_id' }));
		}
		let team_id = decodeURIComponent(this.request.query.team_id).toLowerCase();
		if (!this.user.has_team(team_id)) {
			return callback(this.error_handler.error('read_auth'));
		}
		let stream_id = decodeURIComponent(this.request.query.stream_id).toLowerCase();
		this.authorize_stream(team_id, stream_id, callback);
	}

	authorize_stream (team_id, stream_id, callback) {
		this.data.streams.get_by_id(
			stream_id,
			(error, stream) => {
				if (error) { return callback(error); }
				if (!stream || stream.get('team_id') !== team_id) {
					return callback(this.error_handler.error('not_found', { info: 'stream' }));
				}
				if (
					stream.get('type') !== 'file' &&
					(stream.get('member_ids') || []).indexOf(this.user.id) === -1
				) {
					return callback(this.error_handler.error('read_auth'));
				}
				return process.nextTick(callback);
			}
		);
	}

	build_query () {
		let query = {};
		this.have_relational = false;
		for (let parameter in this.request.query || {}) {
			if (this.request.query.hasOwnProperty(parameter)) {
				let value = decodeURIComponent(this.request.query[parameter]).toLowerCase();
				parameter = decodeURIComponent(parameter).toLowerCase();
				let error = this.process_query_parameter(parameter, value, query);
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

	process_query_parameter (parameter, value, query) {
		if (BASIC_QUERY_PARAMETERS.indexOf(parameter) !== -1) {
			query[parameter] = value;
		}
		else if (parameter === 'ids') {
			let ids = value.split(',');
			ids = ids.map(id => this.data.posts.object_id_safe(id));
			query._id = { $in: ids };
		}
		else if (parameter === 'newer_than') {
			let newer_than = parseInt(value, 10);
			if (newer_than) {
				query.modified_at = { $gt: newer_than };
			}
		}
		else if (parameter === 'mine') {
			query.creator_id = this.user.id;
		}
		else if (RELATIONAL_PARAMETERS.indexOf(parameter) !== -1) {
			let error = this.process_relational_parameter(parameter, value, query);
			if (error) { return error; }
		}
		else if (NON_FILTERING_PARAMETERS.indexOf(parameter) === -1) {
			return 'invalid query parameter: ' + parameter;
		}
	}

	process_relational_parameter (parameter, value, query) {
		if (this.have_relational) {
			return 'only one relational parameter allowed';
		}
		this.have_relational = true;
		query._id = {};
		let id = this.data.posts.object_id_safe(value);
		if (!id) {
			return 'invalid id: ' + value;
		}
		query._id['$' + parameter] = id;
	}

	get_query_options () {
		let limit = 0;
		if (this.request.query.limit) {
			limit = decodeURIComponent(this.request.query.limit);
			limit = parseInt(limit, 10);
		}
		this.limit = limit ?
			Math.min(limit, this.api.config.limits.max_posts_per_request || 100) :
			this.api.config.limits.max_posts_per_request;
		this.limit += 1;
		let sort = { _id: -1 };
		if (this.request.query.sort && this.request.query.sort.toLowerCase() === 'asc') {
			sort = { _id: 1 };
		}
		return {
			database_options: {
				sort: sort,
				limit: this.limit
			}
		};
	}

	process (callback) {
		super.process((error) => {
			if (error) { return callback(error); }
			if (this.response_data.posts.length === this.limit) {
				this.response_data.posts.splice(-1);
				this.response_data.more = true;
			}
			process.nextTick(callback);
		});
	}
}

module.exports = Get_Posts_Request;
