'use strict';

var Get_Many_Request = require(process.env.CI_API_TOP + '/lib/util/restful/get_many_request');

class Get_Repos_Request extends Get_Many_Request {

	process (callback) {
		if (this.request.params.id === '~') {
			this.respond_with_repos(callback);
		}
		else {
			super.process(callback);
		}
	}

	respond_with_repos (callback) {
		this.data.repos.get_by_query(
			{ company_id: { $in: request.user.company_ids } },
			(error, repos) => {
				if (error) { return callback(error); }
				this.response_data = { repos: repos };
				return process.nextTick(callback);
			}
		);
	}
}

module.exports = Get_Repos_Request;
