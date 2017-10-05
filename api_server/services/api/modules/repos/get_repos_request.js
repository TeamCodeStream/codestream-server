'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Get_Many_Request = require(process.env.CI_API_TOP + '/lib/util/restful/get_many_request');

class Get_Repos_Request extends Get_Many_Request {

	process (callback) {
		if (this.request.params.id === '~') {
			this.respond_with_my_repos(callback);
		}
		else {
			super.process(callback);
		}
	}

	respond_with_my_repos (callback) {
		Bound_Async.series(this, [
			this.fetch_repos,
			this.sanitize
		], error => {
			if (error) { return callback(error); }
			this.response_data = { repos: this.sanitized_objects };
			return process.nextTick(callback);
		});
	}

	fetch_repos (callback) {
		this.data.repos.get_by_query(
			{ company_id: { $in: this.user.get('company_ids') } },
			(error, repos) => {
				if (error) { return callback(error); }
				this.models = repos;
				callback();
			}
		);
	}
}

module.exports = Get_Repos_Request;
