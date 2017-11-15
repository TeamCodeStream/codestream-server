'use strict';

var Assert = require('assert');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var NormalizeURL = require('normalize-url');
const RepoTestConstants = require('../repo_test_constants');

class PostRepoTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.testOptions = {};
		this.teamEmails = [];
		this.repoOptions = {};
		this.userData = [];
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

	getExpectedFields () {
		let expectedResponse = RepoTestConstants.EXPECTED_REPO_RESPONSE;
		if (this.testOptions.teamNotRequired) {
			delete expectedResponse.team;
			delete expectedResponse.company;
		}
		return expectedResponse;
	}

	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,
			this.createMixedUsers,
			this.createOtherRepo,
			this.createConflictingUserWithCurrentUser,
			this.createConflictingUserWithExistingUser,
			this.makeRepoData
		], callback);
	}

	createOtherUser (callback) {
		if (!this.testOptions.wantOtherUser) {
			return callback();
		}
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	createMixedUsers (callback) {
		if (!this.testOptions.wantRandomEmails) {
			return callback();
		}
		BoundAsync.series(this, [
			this.createRandomUnregisteredUsers,
			this.createRandomRegisteredUsers,
			this.createRandomEmails
		], callback);
	}

	createRandomUnregisteredUsers (callback) {
		this.createRandomUsers(callback, { noConfirm: true});
	}

	createRandomRegisteredUsers (callback) {
		this.createRandomUsers(callback);
	}

	createRandomUsers (callback, options) {
		this.userFactory.createRandomUsers(
			2,
			(error, response) => {
				if (error) { return callback(error); }
				this.userData = [...this.userData, ...response];
				let emails = response.map(userData => { return userData.user.email; });
				this.teamEmails = [...this.teamEmails, ...emails];
				callback();
			},
			options
		);
	}

	createRandomEmails (callback) {
		for (let i = 0; i < 2; i++) {
			this.teamEmails.push(this.userFactory.randomEmail());
		}
		callback();
	}

	createOtherRepo (callback) {
		if (!this.testOptions.wantOtherRepo) {
			return callback();
		}
		this.otherRepoOptions = this.otherRepoOptions || { token: this.token };
		this.repoFactory.createRandomRepo((error, response) => {
			if (error) { return callback(error); }
			this.existingRepo = response.repo;
			callback();
		}, this.otherRepoOptions);
	}

	createConflictingUserWithCurrentUser (callback) {
		if (!this.testOptions.wantConflictingUserWithCurrentUser) {
			return callback();
		}
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.teamEmails.push(response.user.email);
				callback();
			},
			{ with: { username: this.currentUser.username } }
		);
	}

	createConflictingUserWithExistingUser (callback) {
		if (!this.testOptions.wantConflictingUserWithExistingUser) {
			return callback();
		}
		let userWithUsername = this.userData.find(user => !!user.user.username);
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.teamEmails.push(response.user.email);
				callback();
			},
			{ with: { username: userWithUsername.user.username } }
		);
	}

	makeRepoData (callback) {
		if (this.teamEmails.length > 0) {
			this.repoOptions.withEmails = this.teamEmails;
		}
		this.repoFactory.getRandomRepoData((error, data) => {
			if (error) { return callback(error); }
			this.data = data;
			this.teamData = data.team;
			callback();
		}, this.repoOptions);
	}

	validateResponse (data) {
		let repo = data.repo;
		let errors = [];
		let result = (
			((repo.url === NormalizeURL(this.data.url.toLowerCase())) || errors.push('incorrect url')) &&
			((repo.firstCommitSha === this.data.firstCommitSha.toLowerCase()) || errors.push('incorrect firstCommitSha')) &&
			((repo.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof repo.createdAt === 'number') || errors.push('createdAt not number')) &&
			((repo.modifiedAt >= repo.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			(!this.notCreatedByMe || (repo.creatorId === this.currentUser._id) || errors.push('creatorId not equal to current user id'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		if (this.teamEmails && this.teamEmails.length > 0) {
			this.validateUsers(data);
		}
		if (!this.testOptions.teamNotRequired) {
			this.validateTeam(data);
			this.validateCompany(data);
		}
		this.validateSanitized(repo, RepoTestConstants.UNSANITIZED_ATTRIBUTES);
	}

	validateTeam (data) {
		let team = data.team;
		let repo = data.repo;
		let errors = [];
		Assert(typeof team === 'object', 'team expected with response');
		let result = (
			((team._id === repo.teamId) || errors.push('team id is not the same as repo teamId')) &&
			((team.name === this.teamData.name) || errors.push('team name doesn\'t match')) &&
			((JSON.stringify(team.memberIds.sort()) === JSON.stringify((this.teamData.memberIds || [this.currentUser._id]).sort())) || errors.push('team membership doesn\'t match')) &&
			((team.companyId === repo.companyId) || errors.push('team companyId is not the same as repo companyId')) &&
			((team.deactivated === false) || errors.push('team.deactivated not false')) &&
			((typeof team.createdAt === 'number') || errors.push('team.createdAt not number')) &&
			((team.modifiedAt >= team.createdAt) || errors.push('team.modifiedAt not greater than or equal to createdAt')) &&
			((team.creatorId === this.currentUser._id) || errors.push('team.creatorId not equal to current user id'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		this.validateSanitized(team, RepoTestConstants.UNSANITIZED_TEAM_ATTRIBUTES);
	}

	validateCompany (data) {
		let repo = data.repo;
		let team = data.team;
		let company = data.company;
		let errors = [];
		Assert(typeof company === 'object', 'company expected with response');
		let result = (
			((company._id === repo.companyId) || errors.push('company id is not the same as repo companyId')) &&
			((company.name === this.teamData.name) || errors.push('company name doesn\'t match')) &&
			((company.deactivated === false) || errors.push('company.deactivated not false')) &&
			((typeof company.createdAt === 'number') || errors.push('company.createdAt not number')) &&
			((company.modifiedAt >= company.createdAt) || errors.push('company.modifiedAt not greater than or equal to createdAt')) &&
			((company.creatorId === this.currentUser._id) || errors.push('company.creatorId not equal to current user id'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		this.validateSanitized(team, RepoTestConstants.UNSANITIZED_COMPANY_ATTRIBUTES);
	}

	validateUsers (data) {
		Assert(data.users instanceof Array, 'no users array returned');
		data.users.forEach(user => {
			Assert(this.teamEmails.indexOf(user.email) !== -1, `got unexpected email ${user.email}`);
			Assert(user.teamIds.indexOf(data.repo.teamId) !== -1, `user ${user.email} doesn't have the team for the repo`);
			Assert(user.companyIds.indexOf(data.repo.companyId) !== -1, `user ${user.email} doesn't have the company for the repo`);
			if (data.team) {
				Assert(data.team.memberIds.indexOf(user._id) !== -1, `user ${user.email} not a member of the team for the repo`);
			}
			this.validateSanitized(user, RepoTestConstants.UNSANITIZED_USER_ATTRIBUTES);
		});
		if (!this.testOptions.teamNotRequired) {
			let addedUserIds = data.users.map(user => user._id);
			this.teamData.memberIds = [this.currentUser._id, ...addedUserIds].sort();
		}
	}
}

module.exports = PostRepoTest;
