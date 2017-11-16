'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
const CompanyTestConstants = require('../company_test_constants');

class GetCompaniesTest extends CodeStreamAPITest {

	before (callback) {
		BoundAsync.series(this, [
			this.createRandomRepoByMe,
			this.createOtherUser,
			this.createRandomReposWithMe,
			this.createRandomRepoWithoutMe,
			this.setPath
		], callback);
	}

	createRandomRepoByMe (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.myRepo = response.repo;
				this.myCompany = response.company;
				callback();
			},
			{
				withRandomEmails: 2,
				token: this.token
			}
		);
	}

	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

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

	createRandomRepoWithMe (n, callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherRepos.push(response.repo);
				this.otherCompanies.push(response.company);
				callback();
			},
			{
				withRandomEmails: 2,
				withEmails: [this.currentUser.email],
				token: this.otherUserData.accessToken
			}
		);
	}

	createRandomRepoWithoutMe (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.foreignRepo = response.repo;
				this.foreignCompany = response.company;
				callback();
			},
			{
				withRandomEmails: 2,
				token: this.otherUserData.accessToken
			}
		);
	}

	validateResponse (data) {
		this.validateSanitizedObjects(data.companies, CompanyTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetCompaniesTest;
