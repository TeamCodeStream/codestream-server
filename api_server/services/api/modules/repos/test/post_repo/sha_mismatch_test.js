'use strict';

var Post_Repo_Test = require('./post_repo_test');

class Sha_Mismatch_Test extends Post_Repo_Test {

	constructor (options) {
		super(options);
		this.test_options.want_other_repo = true;
	}

	get description () {
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

	make_repo_data (callback) {
		this.data = {
			url: this.existing_repo.url,
			first_commit_sha: this.repo_factory.random_sha()
		};
		callback();
	}
}

module.exports = Sha_Mismatch_Test;
