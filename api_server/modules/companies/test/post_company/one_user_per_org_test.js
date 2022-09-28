// provide a base class for many of the tests of the "POST /companies" request to create a company
// this serves as the primary base class in one-user-per-org mode
// once we have fully moved to ONE_USER_PER_ORG, this becomes the default test case

'use strict';

const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class OneUserPerOrgTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.oneUserPerOrg = true; // ONE_USER_PER_ORG
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/companies';
	}

	get description () {
		return 'should return a valid company when creating a new company';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.makeCompanyData
		], callback);
	}

	// make the data to use when issuing the request
	makeCompanyData (callback) {
		this.data = {
			name: this.companyFactory.randomName()
		};
		callback();
	}

	// validate the response to the test request
	validateResponse (data) {
		this.responseData = data;
		const { accessToken, userId, teamId } = data;
		Assert(accessToken && typeof accessToken === 'string', 'access token not returned or not string type');
		Assert(userId && typeof userId === 'string', 'user id not returned or not string type');
		Assert(userId !== this.currentUser.user.id, 'userId returned is equal to the joining user, but should represent a duplicate user object');
		Assert(teamId && typeof teamId === 'string', 'team id not returned or not string type');
		Assert(teamId !== this.team.id, 'teamId returned is equal to the original team, but should represent a duplicate object');
	}
}

module.exports = OneUserPerOrgTest;
