'use strict';

var Get_Many_Request = require(process.env.CI_API_TOP + '/lib/util/restful/get_many_request');
const STREAM_TYPES = require('./stream_types');

const BASIC_QUERY_PARAMETERS = [
	'repo_id',
	'type'
];

class Get_Streams_Request extends Get_Many_Request {

	build_query () {
		if (
			Object.keys(this.request.query).length === 1 &&
			Object.keys(this.request.query)[0] === 'ids'
		) {
			return null;
		}
		var query = {};
		for (var parameter in this.request.query || {}) {
			if (this.request.query.hasOwnProperty(parameter)) {
				var error = this.process_query_parameter(parameter, query);
				if (error) {
					return error;
				}
			}
		}
		if (Object.keys(query).length === 0) {
			 return null;
		}
		if (Object.keys(query).indexOf('company_id') === -1) {
			return 'company_id is required';	// company_id is required for all queries (anticipating sharding)
		}
		if (Object.keys(query).indexOf('team_id') === -1) {
			return 'team_id is required';	// team_id is required for all queries (just for extra specificity)
		}
		if (query.type && query.repo_id && query.type !== 'file') {
			return 'can\'t query on type and repo_id at the same time unless type is file';
		}
		if (query.type && STREAM_TYPES.indexOf(query.type) === -1) {
			return `invalid stream type: ${query.type}`;
		}
		return query;
	}

	process_query_parameter (parameter, query) {
		if (BASIC_QUERY_PARAMETERS.indexOf(parameter) !== -1) {
			query[parameter] = decodeURIComponent(this.request.query[parameter]);
		}
	}
}

module.exports = Get_Streams_Request;
