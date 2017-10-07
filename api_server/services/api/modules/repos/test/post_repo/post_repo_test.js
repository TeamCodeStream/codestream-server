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
		let expected_response = Repo_Test_Constants.EXPECTED_REPO_RESPONSE;
		if (this.team_not_required) {
			delete expected_response.team;
			delete expected_response.company;
		}
		return expected_response;
	}

	before (callback) {
		this.repo_factory.get_random_repo_data((error, data) => {
			if (error) { return callback(error); }
			this.data = data;
			this.team_data = data.team;
			callback();
		}, this.repo_options);
	}

	validate_response (data) {
		var repo = data.repo;
		var errors = [];
		var result = (
			((repo.url === Normalize_URL(this.data.url.toLowerCase())) || errors.push('incorrect url')) &&
			((repo.first_commit_sha === this.data.first_commit_sha.toLowerCase()) || errors.push('incorrect first_commit_sha')) &&
			((repo.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof repo.created_at === 'number') || errors.push('created_at not number')) &&
			((repo.modified_at >= repo.created_at) || errors.push('modified_at not greater than or equal to created_at')) &&
			(!this.not_created_by_me || (repo.creator_id === this.current_user._id) || errors.push('creator_id not equal to current user id'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		if (!this.team_not_required) {
			this.validate_team(data);
			this.validate_company(data);
		}
		this.validate_sanitized(repo, Repo_Test_Constants.UNSANITIZED_ATTRIBUTES);
	}

	validate_team (data) {
		var team = data.team;
		var repo = data.repo;
		var errors = [];
		Assert(typeof team === 'object', 'team expected with response');
		var result = (
			((team._id === repo.team_id) || errors.push('team id is not the same as repo team_id')) &&
			((team.name === this.team_data.name) || errors.push('team name doesn\'t match')) &&
			((JSON.stringify(team.member_ids.sort()) === JSON.stringify((this.team_data.member_ids || [this.current_user._id]).sort())) || errors.push('team membership doesn\'t match')) &&
			((team.company_id === repo.company_id) || errors.push('team company_id is not the same as repo company_id')) &&
			((team.deactivated === false) || errors.push('team.deactivated not false')) &&
			((typeof team.created_at === 'number') || errors.push('team.created_at not number')) &&
			((team.modified_at >= team.created_at) || errors.push('team.modified_at not greater than or equal to created_at')) &&
			((team.creator_id === this.current_user._id) || errors.push('team.creator_id not equal to current user id'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		this.validate_sanitized(team, Repo_Test_Constants.UNSANITIZED_TEAM_ATTRIBUTES);
	}

	validate_company (data) {
		var repo = data.repo;
		var team = data.team;
		var company = data.company;
		var errors = [];
		Assert(typeof company === 'object', 'company expected with response');
		var result = (
			((company._id === repo.company_id) || errors.push('company id is not the same as repo company_id')) &&
			((company.name === this.team_data.name) || errors.push('company name doesn\'t match')) &&
			((company.deactivated === false) || errors.push('company.deactivated not false')) &&
			((typeof company.created_at === 'number') || errors.push('company.created_at not number')) &&
			((company.modified_at >= company.created_at) || errors.push('company.modified_at not greater than or equal to created_at')) &&
			((company.creator_id === this.current_user._id) || errors.push('company.creator_id not equal to current user id'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		this.validate_sanitized(team, Repo_Test_Constants.UNSANITIZED_COMPANY_ATTRIBUTES);

	}
}

module.exports = Post_Repo_Test;
