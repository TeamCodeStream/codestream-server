'use strict';

var ConfirmationTest = require('./confirmation_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Assert = require('assert');

class InitialDataTest extends ConfirmationTest {

	get description () {
		return 'user should receive teams and repos with response to email confirmation';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createOtherUser,
			this.createRepo
		], callback);
	}

	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.otherUserData = response;
				callback();
			}
		);
	}

	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.repo = response.repo;
				callback();
			},
			{
				withEmails: [this.data.email],
				token: this.otherUserData.accessToken
			}
		);
	}

	validateResponse (data) {
		Assert(data.teams.length === 1, 'no team in response');
		this.validateMatchingObject(this.team._id, data.teams[0], 'team');
		Assert(data.repos.length === 1, 'no repo in response');
		this.validateMatchingObject(this.repo._id, data.repos[0], 'repo');
		super.validateResponse(data);
	}
}

module.exports = InitialDataTest;
