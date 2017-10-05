'use strict';

var Get_Many_Request = require(process.env.CI_API_TOP + '/lib/util/restful/get_many_request');

class Get_Teams_Request extends Get_Many_Request {

	process (callback) {
		if (this.request.params.id === '~') {
			this.respond_with_teams(callback);
		}
		else {
			super.process(callback);
		}
	}

	respond_with_teams (callback) {
		this.data.teams.get_by_ids(
			this.user.team_ids,
			(error, teams) => {
				if (error) { return callback(error); }
				this.response_data = { teams: teams };
				return process.nextTick(callback);
			}
		);
	}
}

module.exports = Get_Teams_Request;
