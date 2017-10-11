'use strict';

var Get_Many_Request = require(process.env.CI_API_TOP + '/lib/util/restful/get_many_request');

const BASIC_QUERY_PARAMETERS = [
	'company_id',
	'stream_id',
	'commit_id',
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

	build_query () {
		if (
			Object.keys(this.request.query).length === 1 &&
			Object.keys(this.request.query)[0] === 'ids'
		) {
			return null;
		}
		let query = {};
		this.have_relational = false;
		for (let parameter in this.request.query || {}) {
			if (this.request.query.hasOwnProperty(parameter)) {
				let error = this.process_query_parameter(parameter, query);
				if (error) {
					return error;
				}
			}
		}
		if (Object.keys(query).length === 0) {
			 return null;
		}
		if (Object.keys(query).indexOf('company_id') === -1) {
			return 'company_id is required';	// org_id is required for all queries (anticipating sharding)
		}
		return query;
	}

	process_query_parameter (parameter, query) {
		if (BASIC_QUERY_PARAMETERS.indexOf(parameter) !== -1) {
			query[parameter] = decodeURIComponent(this.request.query[parameter]);
		}
		else if (parameter === 'newer_than') {
			let newer_than = parseInt(this.request.query[parameter], 10);
			if (newer_than) {
				query.modified_at = { $gt: parseInt(this.request.query[parameter], 10) };
			}
		}
		else if (parameter === 'mine') {
			query.creator_id = this.user.id;
		}
		else if (RELATIONAL_PARAMETERS.indexOf(parameter) !== -1) {
			let error = this.process_relational_parameter(parameter, query);
			if (error) { return error; }
		}
		else if (NON_FILTERING_PARAMETERS.indexOf(parameter) === -1) {
			return 'invalid query parameter: ' + parameter;
		}
	}

	process_relational_parameter (parameter, query) {
		if (this.have_relational) {
			return 'only one relational parameter allowed';
		}
		this.have_relational = true;
		query._id = {};
		let relational_id = this.request.query[parameter];
		let id = this.data.posts.object_id_safe(decodeURIComponent(relational_id));
		if (!id) {
			return 'invalid id: ' + relational_id;
		}
		query._id['$' + parameter] = id;
	}

	get_query_options () {
		let limit = parseInt(this.request.query.limit || 0, 10);
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
