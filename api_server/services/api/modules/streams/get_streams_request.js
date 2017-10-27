'use strict';

var Get_Many_Request = require(process.env.CS_API_TOP + '/lib/util/restful/get_many_request');
const STREAM_TYPES = require('./stream_types');

const BASIC_QUERY_PARAMETERS = [
	'team_id',
	'repo_id',
	'type',
	'ids'
];

class Get_Streams_Request extends Get_Many_Request {

	authorize (callback) {
		if (!this.request.query.team_id) {
			return callback(this.error_handler.error('parameter_required', { info: 'team_id' }));
		}
		let team_id = decodeURIComponent(this.request.query.team_id).toLowerCase();
		if (!this.user.has_team(team_id)) {
			return callback(this.error_handler.error('read_auth'));
		}
		return process.nextTick(callback);
	}

	build_query () {
		let query = this.form_query_from_parameters();
		return this.check_valid_query(query);
	}

	form_query_from_parameters () {
		let query = {};
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
		return query;
	}

	check_valid_query (query) {
		if (!query.team_id) {
			return ('team_id required');
		}
		if (query.type && STREAM_TYPES.indexOf(query.type) === -1) {
			return `invalid stream type: ${query.type}`;
		}
		if (query.type && query.type === 'file') {
			if (!query.repo_id) {
				return 'queries for file streams require repo_id';
			}
		}
		else if (query.type) {
			delete query.repo_id;
		}
		if (!query.repo_id) {
			query.member_ids = this.user.id;
		}
		return query;
	}

	process_query_parameter (parameter, value, query) {
		if (BASIC_QUERY_PARAMETERS.indexOf(parameter) !== -1) {
			if (parameter === 'ids') {
				let ids = value.split(',');
				ids = ids.map(id => this.data.streams.object_id_safe(id));
				query._id = { $in: ids };
			}
			else {
				query[parameter] = value;
			}
		}
	}
}

module.exports = Get_Streams_Request;
