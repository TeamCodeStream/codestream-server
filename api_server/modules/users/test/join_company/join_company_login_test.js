'use strict';

const JoinCompanyTest = require('./join_company_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');
const UserTestConstants = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/test/user_test_constants');

class JoinCompanyLoginTest extends JoinCompanyTest {

	get description () {
		const by = this.byDomainJoining ? 'domain joining' : 'invite';
		return `should be able to login after joining a company by ${by}`;
	}

	get method () {
		return 'put';
	}

	setPath (callback) {
		this.path = '/login';
		callback();
	}
	
	getExpectedFields () {
		return { ...UserTestConstants.EXPECTED_LOGIN_RESPONSE };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// do the usual test prep
			this.doJoin	// perform the actual join
		], callback);
	}

	// validate that the response is correct
	validateResponse (data) {
		Assert.strictEqual(data.user.id, this.joinResponse.userId, 'returned user not equal to the joined user');
		Assert.strictEqual(data.teams.length, 1, '1 and only 1 team should be returned');
		Assert.strictEqual(data.teams[0].id, this.joinResponse.teamId, 'returned team not equal to the expected team');
		Assert(typeof data.user.nrUserId === 'string', 'nrUserId not set');
	}
}

module.exports = JoinCompanyLoginTest;
