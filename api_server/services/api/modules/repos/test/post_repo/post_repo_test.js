'use strict';

var Assert = require('assert');
var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Normalize_URL = require('normalize-url');
const Repo_Test_Constants = require('../repo_test_constants');

class Post_Repo_Test extends CodeStream_API_Test {

	constructor (options) {
		super(options);
		this.test_options = {};
		this.team_emails = [];
		this.repo_options = {};
		this.user_data = [];
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/repos';
	}

	get description () {
		return `should return valid repo when creating a new repo`;
	}

	get_expected_fields () {
		let expected_response = Repo_Test_Constants.EXPECTED_REPO_RESPONSE;
		if (this.test_options.team_not_required) {
			delete expected_response.team;
			delete expected_response.company;
		}
		return expected_response;
	}

	before (callback) {
		Bound_Async.series(this, [
			this.create_other_user,
			this.create_mixed_users,
			this.create_other_repo,
			this.create_conflicting_user_with_current_user,
			this.create_conflicting_user_with_existing_user,
			this.make_repo_data
		], callback);
	}

	create_other_user (callback) {
		if (!this.test_options.want_other_user) {
			return callback();
		}
		this.user_factory.create_random_user(
			(error, response) => {
				if (error) { return callback(error); }
				this.other_user_data = response;
				callback();
			}
		);
	}

	create_mixed_users (callback) {
		if (!this.test_options.want_random_emails) {
			return callback();
		}
		Bound_Async.series(this, [
			this.create_random_unregistered_users,
			this.create_random_registered_users,
			this.create_random_emails
		], callback);
	}

	create_random_unregistered_users (callback) {
		this.create_random_users(callback, { no_confirm: true});
	}

	create_random_registered_users (callback) {
		this.create_random_users(callback);
	}

	create_random_users (callback, options) {
		this.user_factory.create_random_users(
			2,
			(error, response) => {
				if (error) { return callback(error); }
				this.user_data = [...this.user_data, ...response];
				let emails = response.map(user_data => { return user_data.user.email; });
				this.team_emails = [...this.team_emails, ...emails];
				callback();
			},
			options
		);
	}

	create_random_emails (callback) {
		for (let i = 0; i < 2; i++) {
			this.team_emails.push(this.user_factory.random_email());
		}
		callback();
	}

	create_other_repo (callback) {
		if (!this.test_options.want_other_repo) {
			return callback();
		}
		this.other_repo_options = this.other_repo_options || { token: this.token };
		this.repo_factory.create_random_repo((error, response) => {
			if (error) { return callback(error); }
			this.existing_repo = response.repo;
			callback();
		}, this.other_repo_options);
	}

	create_conflicting_user_with_current_user (callback) {
		if (!this.test_options.want_conflicting_user_with_current_user) {
			return callback();
		}
		this.user_factory.create_random_user(
			(error, response) => {
				if (error) { return callback(error); }
				this.team_emails.push(response.user.email);
				callback();
			},
			{ with: { username: this.current_user.username } }
		);
	}

	create_conflicting_user_with_existing_user (callback) {
		if (!this.test_options.want_conflicting_user_with_existing_user) {
			return callback();
		}
		let user_with_username = this.user_data.find(user => !!user.user.username);
		this.user_factory.create_random_user(
			(error, response) => {
				if (error) { return callback(error); }
				this.team_emails.push(response.user.email);
				callback();
			},
			{ with: { username: user_with_username.user.username } }
		);
	}

	make_repo_data (callback) {
		if (this.team_emails.length > 0) {
			this.repo_options.with_emails = this.team_emails;
		}
		this.repo_factory.get_random_repo_data((error, data) => {
			if (error) { return callback(error); }
			this.data = data;
			this.team_data = data.team;
			callback();
		}, this.repo_options);
	}

	validate_response (data) {
		let repo = data.repo;
		let errors = [];
		let result = (
			((repo.url === Normalize_URL(this.data.url.toLowerCase())) || errors.push('incorrect url')) &&
			((repo.first_commit_sha === this.data.first_commit_sha.toLowerCase()) || errors.push('incorrect first_commit_sha')) &&
			((repo.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof repo.created_at === 'number') || errors.push('created_at not number')) &&
			((repo.modified_at >= repo.created_at) || errors.push('modified_at not greater than or equal to created_at')) &&
			(!this.not_created_by_me || (repo.creator_id === this.current_user._id) || errors.push('creator_id not equal to current user id'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		if (this.team_emails && this.team_emails.length > 0) {
			this.validate_users(data);
		}
		if (!this.test_options.team_not_required) {
			this.validate_team(data);
			this.validate_company(data);
		}
		this.validate_sanitized(repo, Repo_Test_Constants.UNSANITIZED_ATTRIBUTES);
	}

	validate_team (data) {
		let team = data.team;
		let repo = data.repo;
		let errors = [];
		Assert(typeof team === 'object', 'team expected with response');
		let result = (
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
		let repo = data.repo;
		let team = data.team;
		let company = data.company;
		let errors = [];
		Assert(typeof company === 'object', 'company expected with response');
		let result = (
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

	validate_users (data) {
		Assert(data.users instanceof Array, 'no users array returned');
		data.users.forEach(user => {
			Assert(this.team_emails.indexOf(user.email) !== -1, `got unexpected email ${user.email}`);
			Assert(user.team_ids.indexOf(data.repo.team_id) !== -1, `user ${user.email} doesn't have the team for the repo`);
			Assert(user.company_ids.indexOf(data.repo.company_id) !== -1, `user ${user.email} doesn't have the company for the repo`);
			if (data.team) {
				Assert(data.team.member_ids.indexOf(user._id) !== -1, `user ${user.email} not a member of the team for the repo`);
			}
			this.validate_sanitized(user, Repo_Test_Constants.UNSANITIZED_USER_ATTRIBUTES);
		});
		if (!this.test_options.team_not_required) {
			let added_user_ids = data.users.map(user => user._id);
			this.team_data.member_ids = [this.current_user._id, ...added_user_ids].sort();
		}
	}
}

module.exports = Post_Repo_Test;
