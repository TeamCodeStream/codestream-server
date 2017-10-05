'use strict';

var Assert = require('assert');
var CodeStream_API_Test = require(process.env.CI_API_TOP + '/lib/test_base/codestream_api_test');
var Repo_Test_Constants = require('../repo_test_constants');
var Normalize_URL = require('normalize-url');

class Post_Repo_Test extends CodeStream_API_Test {

	get method () {
		return 'post';
	}

	get path () {
		return '/repos';
	}

	get_description () {
		return `should return valid repo when creating a new repo`;
	}

	get_expected_fields () {
		return { repo: Repo_Test_Constants.EXPECTED_REPO_FIELDS };
	}

	before (callback) {
		this.repo_factory.get_random_repo_data((error, data) => {
			if (error) { return callback(error); }
			this.data = data;
			callback();
		});
	}

	validate_response (data) {
console.warn('this.data', this.data);
console.warn('data', data);
		var repo = data.repo;
		var errors = [];
		var result = (
			((repo.url === Normalize_URL(this.data.url.toLowerCase())) || errors.push('incorrect url')) &&
			((repo.first_commit_sha === this.data.first_commit_sha.toLowerCase()) || errors.push('incorrect first_commit_sha')) &&
			((repo.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof repo.created_at === 'number') || errors.push('created_at not number')) &&
			((repo.modified_at >= repo.created_at) || errors.push('modified_at not greater than or equal to created_at')) &&
			((repo.creator_id === this.current_user._id) || errors.push('creator_id not equal to _id'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		this.validate_sanitized(repo, Repo_Test_Constants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = Post_Repo_Test;
