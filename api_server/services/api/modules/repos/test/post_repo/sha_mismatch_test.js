'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Post_Repo_Test = require('./post_repo_test');

class Sha_Mismatch_Test extends Post_Repo_Test {

	get_description () {
		return 'should return an error when trying to create a repo that already exists and the first commit SHA doesn\'t match';
	}

	get_expected_fields () {
		return null;
	}

	get_expected_error () {
		return {
			code: 'REPO-1000',
		};
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.create_repo
		], callback);
	}

	create_repo (callback) {
		this.repo_factory.create_random_repo((error, response) => {
			if (error) { return callback(error); }
			let repo = response.repo;
			this.data = {
				url: repo.url,
				first_commit_sha: this.repo_factory.random_sha()
			};
			callback();
		}, { token: this.token });
	}
}

module.exports = Sha_Mismatch_Test;
