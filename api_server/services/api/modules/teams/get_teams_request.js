'use strict';

var Get_Many_Request = require(process.env.CS_API_TOP + '/lib/util/restful/get_many_request');

class Get_Teams_Request extends Get_Many_Request {

	authorize (callback) {
		if (this.request.query.hasOwnProperty('mine')) {
			return callback();
		}
		else if (!this.request.query.ids) {
			return callback(this.error_handler.error('parameter_required', { info: 'ids' }));
		}
		let team_ids = decodeURIComponent(this.request.query.ids).toLowerCase().split(',');
		if (!this.user.has_teams(team_ids)) {
			return callback(this.error_handler.error('read_auth'));
		}
		return process.nextTick(callback);
	}

	process (callback) {
		if (this.request.query.hasOwnProperty('mine')) {
			this.ids = this.user.get('team_ids') || [];
		}
		super.process(callback);
	}
}

module.exports = Get_Teams_Request;
