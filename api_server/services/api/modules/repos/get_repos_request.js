'use strict';

var Get_Many_Request = require(process.env.CS_API_TOP + '/lib/util/restful/get_many_request');

class Get_Repos_Request extends Get_Many_Request {

	build_query () {
		if (this.request.query.team_id) {
			return { team_id: this.request.query.team_id };
		}
	}
}

module.exports = Get_Repos_Request;
