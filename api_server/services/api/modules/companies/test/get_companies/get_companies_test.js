'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
const CompanyTestConstants = require('../company_test_constants');

class GetCompaniesTest extends CodeStreamAPITest {

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.createRandomRepoByMe,		// create a random repo, as me
			this.createOtherUser,			// create another user
			this.createRandomReposWithMe,	// create some random repos as the other user, but with me included
			this.createRandomRepoWithoutMe,	// create a random repo as the other user, and i'm not included
			this.setPath					// set the path for the request test run
		], callback);
	}

	// create a random repo, as the current user, this also creates a company
	createRandomRepoByMe (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.myRepo = response.repo;
				this.myCompany = response.company;
				callback();
			},
			{
				withRandomEmails: 2, // two other users will be in it
				token: this.token	 // my token
			}
		);
	}

	// create another (registered) user
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	// create a few repos with me as part of the team, therefore company
	createRandomReposWithMe (callback) {
		this.otherRepos = [];
		this.otherCompanies = [];
		BoundAsync.timesSeries(
			this,
			2,
			this.createRandomRepoWithMe,
			callback
		);
	}

	// create a random repo with me as part of the team, therfore company
	createRandomRepoWithMe (n, callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherRepos.push(response.repo);
				this.otherCompanies.push(response.company);
				callback();
			},
			{
				withRandomEmails: 2,	// two other users will be in it
				withEmails: [this.currentUser.email],	// and me
				token: this.otherUserData.accessToken	// the other user is the creator
			}
		);
	}

	// create a random repo where i am not part of the team, therefore not part of the company
	createRandomRepoWithoutMe (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.foreignRepo = response.repo;
				this.foreignCompany = response.company;
				callback();
			},
			{
				withRandomEmails: 2,	// two other users will be in it
				token: this.otherUserData.accessToken	// the other user is the creator
			}
		);
	}

	// validate we got the right companies
	validateResponse (data) {
		this.validateSanitizedObjects(data.companies, CompanyTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetCompaniesTest;
