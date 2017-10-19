'use strict';

var Get_Many_Request = require(process.env.CS_API_TOP + '/lib/util/restful/get_many_request');
const STREAM_TYPES = require('./stream_types');

const BASIC_QUERY_PARAMETERS = [
	'team_id',
	'repo_id',
	'type'
];

class Get_Streams_Request extends Get_Many_Request {

	build_query () {
		if (this.request.query.hasOwnProperty('ids')) {
			return null;
		}
		let query = this.form_query_from_parameters();
		return this.check_valid_query(query);
	}

	form_query_from_parameters () {
		let query = {};
		for (let parameter in this.request.query || {}) {
			if (this.request.query.hasOwnProperty(parameter)) {
				let error = this.process_query_parameter(parameter, query);
				if (error) {
					return error;
				}
			}
		}
		return query;
	}

	check_valid_query (query) {
		if (Object.keys(query).length === 0) {
			 return null;
		}
		if (query.type && STREAM_TYPES.indexOf(query.type) === -1) {
			return `invalid stream type: ${query.type}`;
		}
		if (!query.team_id && !query.repo_id) {
			return ('team_id or repo_id required');
		}
		if (query.type && query.type === 'file') {
			if (!query.repo_id) {
				return 'queries for file streams require repo_id';
			}
			delete query.team_id;
		}
		else if (query.type) {
			if (!query.team_id) {
				return `queries for ${query.type} streams require team_id`;
			}
			delete query.repo_id;
			query.member_ids = this.user.id;
		}
		else if (query.team_id) {
			query.member_ids = this.user.id;
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
