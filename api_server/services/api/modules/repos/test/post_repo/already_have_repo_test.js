'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Post_Repo_Test = require('./post_repo_test');
var Assert = require('assert');

class Already_Have_Repo_Test extends Post_Repo_Test {

	get_description () {
		return 'should return the repo when trying to create a repo that the user already created';
	}

	before (callback) {
		this.team_not_required = true;
		Bound_Async.series(this, [
			super.before,
			this.create_repo
		], callback);
	}

	create_repo (callback) {
		this.repo_factory.create_random_repo((error, response) => {
			if (error) { return callback(error); }
			this.existing_repo = response.repo;
			this.data = {
				url: this.existing_repo.url,
				first_commit_sha: this.existing_repo.first_commit_sha
			};
			callback();
		}, { token: this.token });
	}

	validate_response (data) {
		Assert(data.repo._id === this.existing_repo._id, 'repo returned isn\'t the one created');
		super.validate_response(data);
	}
}

module.exports = Already_Have_Repo_Test;
