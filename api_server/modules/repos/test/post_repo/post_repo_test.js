// base class for many of the POST /repos request tests, configurable according to various options

'use strict';

var Assert = require('assert');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var NormalizeURL = require('../../normalize_url');
const RepoTestConstants = require('../repo_test_constants');

class PostRepoTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.testOptions = {};
		this.teamEmails = [];
		this.teamUsers = [];
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
			// not creating a team on-the-fly, so don't expect a team and company in the response
			delete expectedResponse.team;
			delete expectedResponse.company;
		}
		return expectedResponse;
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,	// create a second registered user as needed
			this.createMixedUsers,	// create several other users, both registered and unregistered, as needed
			this.createOtherRepo,	// create a first repo, which also creates a team... for testing adding another repo to the same team
			this.createConflictingUserWithCurrentUser,	// if needed, try to create a user whose username will conflict with the current user's username
			this.createConflictingUserWithExistingUser,	// if needed, try to create a user whose username will conflict with an existing user in the team
			this.makeRepoData		// make the data to use for the POST /repos request to be tested
		], callback);
	}

	// create a second registered user, as needed
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

	// create several registered and unregistered users, to be added to the team when the repo is created
	createMixedUsers (callback) {
		if (!this.testOptions.wantRandomEmails) {
			return callback();
		}
		BoundAsync.series(this, [
			this.createRandomUnregisteredUsers,	// some already existing unregistered users
			this.createRandomRegisteredUsers,	// some already existing registered users
			this.createRandomEmails,			// some random users not known to the system yet
			this.createRandomNamedUsers			// some random users not known to the system yet, but who have names (gleaned from git in practice)
		], callback);
	}

	// create some unregistered users
	createRandomUnregisteredUsers (callback) {
		this.createRandomUsers(callback, { noConfirm: true});
	}

	// create some registered users
	createRandomRegisteredUsers (callback) {
		this.createRandomUsers(callback);
	}

	// create some users, unregistered or registered as required
	createRandomUsers (callback, options) {
		this.userFactory.createRandomUsers(
			2,
			(error, response) => {
				if (error) { return callback(error); }
				this.userData = [...this.userData, ...response];
				let emails = response.map(userData => { return userData.user.email; });
				this.teamEmails = [...this.teamEmails, ...emails];	// save the emails of all users created
				callback();
			},
			options
		);
	}

	// create a few random emails representing users not yet known to the system, 
	// we'll try to add these when we create the repo
	createRandomEmails (callback) {
		for (let i = 0; i < 2; i++) {
			this.teamEmails.push(this.userFactory.randomEmail());
		}
		callback();
	}

	// create a few random users representing users not yet known to the system, but who have first and last names
	// (gleaned from git in practice) ... we'll try to add these when we create the repo
	createRandomNamedUsers (callback) {
		for (let i = 0; i < 2; i++) {
			this.teamUsers.push(this.userFactory.randomNamedUser());
		}
		callback();
	}

	// create a repo, this will precede the repo we try to create in the actual test, for testing adding a 
	// repo to an existing team
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

	// if needed, creating a user whose username will conflict with the current user's username,
	// causing an error when the attempt to create a repo (and team) is made
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

	// if needed, creating a user whose username will conflict with an existing user's username,
	// causing an error when the attempt to create a repo (and team) is made
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

	// make the data to be used when making the POST /repos request
	makeRepoData (callback) {
		if (this.teamEmails.length > 0) {
			// include pre-generated emails
			this.repoOptions.withEmails = this.teamEmails;
		}
		if (this.teamUsers.length > 0) {
			// include emails of pre-created users
			this.repoOptions.withUsers = this.teamUsers;
		}
		// get some random data to use, with users added as needed
		this.repoFactory.getRandomRepoData((error, data) => {
			if (error) { return callback(error); }
			this.data = data;
			this.teamData = data.team;
			callback();
		}, this.repoOptions);
	}

	// validate the response to the test request
	validateResponse (data) {
		let repo = data.repo;
		let errors = [];
		let result = (
			((repo.url ===this.data.url) || errors.push('incorrect url')) &&
			((repo.normalizedUrl === NormalizeURL(this.data.url)) || errors.push('incorrect url')) &&
			((repo.firstCommitHash === this.data.firstCommitHash.toLowerCase()) || errors.push('incorrect firstCommitHash')) &&
			((repo.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof repo.createdAt === 'number') || errors.push('createdAt not number')) &&
			((repo.modifiedAt >= repo.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			(!this.notCreatedByMe || (repo.creatorId === this.currentUser._id) || errors.push('creatorId not equal to current user id'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		if (this.teamEmails.length > 0 || this.teamUsers.length > 0) {
			this.validateUsers(data);	// validate any users created on the fly
		}
		if (!this.testOptions.teamNotRequired) {
			// validate the team (and company) created on the fly with the repo
			this.validateTeam(data);
			this.validateCompany(data);
		}
		// make sure we didn't get any attributes not suitable to be sent to the client
		this.validateSanitized(repo, RepoTestConstants.UNSANITIZED_ATTRIBUTES);
	}

	// for requests that created a team on the fly, validate the team created
	validateTeam (data) {
		let team = data.team;
		let repo = data.repo;
		let errors = [];
		let expectMemberIds = (this.teamData.memberIds || [this.currentUser._id]);
		Assert(typeof team === 'object', 'team expected with response');
		let result = (
			((team._id === repo.teamId) || errors.push('team id is not the same as repo teamId')) &&
			((team.name === this.teamData.name) || errors.push('team name doesn\'t match')) &&
			((JSON.stringify(team.memberIds.sort()) === JSON.stringify(expectMemberIds.sort())) || errors.push('team membership doesn\'t match')) &&
			((team.companyId === repo.companyId) || errors.push('team companyId is not the same as repo companyId')) &&
			((team.deactivated === false) || errors.push('team.deactivated not false')) &&
			((typeof team.createdAt === 'number') || errors.push('team.createdAt not number')) &&
			((team.modifiedAt >= team.createdAt) || errors.push('team.modifiedAt not greater than or equal to createdAt')) &&
			((team.creatorId === this.currentUser._id) || errors.push('team.creatorId not equal to current user id'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		// make sure we didn't get any attributes not suitable to be sent to the client
		this.validateSanitized(team, RepoTestConstants.UNSANITIZED_TEAM_ATTRIBUTES);
	}

	// for requests that created a team on the fly, validate the company created
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
		// make sure we didn't get any attributes not suitable to be sent to the client
		this.validateSanitized(team, RepoTestConstants.UNSANITIZED_COMPANY_ATTRIBUTES);
	}

	// for requests that created users on the fly, validate the users created
	validateUsers (data) {
		this.teamEmails.push(this.currentUser.email);
		Assert(data.users instanceof Array, 'no users array returned');
		data.users.forEach(user => {
			let found = (
				this.teamEmails.indexOf(user.email) !== -1 ||
				this.teamUsers.find(teamUser => { return teamUser.email === user.email; })
			);
			Assert(found, `got unexpected email ${user.email}`);
			Assert(user.teamIds.indexOf(data.repo.teamId) !== -1, `user ${user.email} doesn't have the team for the repo`);
			Assert(user.companyIds.indexOf(data.repo.companyId) !== -1, `user ${user.email} doesn't have the company for the repo`);
			if (data.team) {
				Assert(data.team.memberIds.indexOf(user._id) !== -1, `user ${user.email} not a member of the team for the repo`);
			}
			// make sure we didn't get any attributes not suitable to be sent to the client
			this.validateSanitized(user, RepoTestConstants.UNSANITIZED_USER_ATTRIBUTES);
		});
		if (!this.testOptions.teamNotRequired) {
			let addedUserIds = data.users.map(user => user._id);
			this.teamData.memberIds = addedUserIds.sort();
		}
	}
}

module.exports = PostRepoTest;
