'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
const CompanyTestConstants = require('../company_test_constants');

class GetCompanyTest extends CodeStreamAPITest {

	// what we expect in the response
	getExpectedFields () {
		return { company: CompanyTestConstants.EXPECTED_COMPANY_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.createRandomRepoByMe,	// create a random repo as me, creating also a team and a company
			this.createOtherUser,		// create another registered user
			this.createRandomRepo,		// create a random repo as the other user
			this.setPath				// set the path of the request to test
		], callback);
	}

	// create a random repo as me, creating also a company that i'll be in
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

	// create a random repo as the other user, which i may or may not be a part of,
	// depending on the test
	createRandomRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherRepo = response.repo;
				this.otherCompany = response.company;
				callback();
			},
			{
				withRandomEmails: 2,	// include two other users
				withEmails: this.withoutMe ? null : [this.currentUser.email],	 // include me or not
				token: this.otherUserData.accessToken	// the other user is the creator
			}
		);
	}

	// validate we got the right company
	validateResponse (data) {
		this.validateSanitized(data.company, CompanyTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetCompanyTest;
