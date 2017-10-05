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
		return Repo_Test_Constants.EXPECTED_REPO_RESPONSE;
	}

	before (callback) {
		this.repo_factory.get_random_repo_data((error, data) => {
			if (error) { return callback(error); }
			this.data = data;
			this.team_data = data.team;
			callback();
		});
	}

	validate_response (data) {
		var repo = data.repo;
		var team = data.team;
		var errors = [];
		var result = (
			((repo.url === Normalize_URL(this.data.url.toLowerCase())) || errors.push('incorrect url')) &&
			((repo.first_commit_sha === this.data.first_commit_sha.toLowerCase()) || errors.push('incorrect first_commit_sha')) &&
			((repo.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof repo.created_at === 'number') || errors.push('created_at not number')) &&
			((repo.modified_at >= repo.created_at) || errors.push('modified_at not greater than or equal to created_at')) &&
			((repo.creator_id === this.current_user._id) || errors.push('creator_id not equal to current user id')) &&
			((team.name === this.team_data.name) || errors.push('team name doesn\'t match')) &&
			((JSON.stringify(team.member_ids.sort()) === JSON.stringify((this.team_data.member_ids || [this.current_user._id]).sort())) || errors.push('team membership doesn\'t match')) &&
			((team.company_id === repo.company_id) || errors.push('team company_id is not the same as repo company_id')) &&
			((team.deactivated === false) || errors.push('team.deactivated not false')) &&
			((typeof team.created_at === 'number') || errors.push('team.created_at not number')) &&
			((team.modified_at >= team.created_at) || errors.push('team.modified_at not greater than or equal to created_at')) &&
			((team.creator_id === this.current_user._id) || errors.push('team.creator_id not equal to current user id'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		this.validate_sanitized(repo, Repo_Test_Constants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = Post_Repo_Test;
