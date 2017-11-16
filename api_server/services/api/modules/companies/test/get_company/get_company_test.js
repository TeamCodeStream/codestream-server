'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
const CompanyTestConstants = require('../company_test_constants');

class GetCompanyTest extends CodeStreamAPITest {

	getExpectedFields () {
		return { company: CompanyTestConstants.EXPECTED_COMPANY_FIELDS };
	}

	before (callback) {
		BoundAsync.series(this, [
			this.createRandomRepoByMe,
			this.createOtherUser,
			this.createRandomRepo,
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

	createRandomRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherRepo = response.repo;
				this.otherCompany = response.company;
				callback();
			},
			{
				withRandomEmails: 2,
				withEmails: this.withoutMe ? null : [this.currentUser.email],
				token: this.otherUserData.accessToken
			}
		);
	}

	validateResponse (data) {
		this.validateSanitized(data.company, CompanyTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetCompanyTest;
