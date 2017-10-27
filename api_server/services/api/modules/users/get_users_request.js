'use strict';

var Get_Many_Request = require(process.env.CS_API_TOP + '/lib/util/restful/get_many_request');

class Get_Users_Request extends Get_Many_Request {

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
		if (!this.request.query.team_id) {
			return this.error_handler.error('parameter_required', { info: 'team_id' });
		}
		let query = {
			team_ids: decodeURIComponent(this.request.query.team_id).toLowerCase()
		};
		if (this.request.query.ids) {
			let ids = decodeURIComponent(this.request.query.ids).toLowerCase().split(',');
			ids = ids.map(id => this.data.users.object_id_safe(id));
			query._id = { $in: ids };
		}
		return query;
	}
}

module.exports = Get_Users_Request;
