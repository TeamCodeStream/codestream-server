// base class for many tests of the "PUT /repos/match/:teamId" requests

'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');

class TeamLookupTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description() {
		return 'should return the repo, its team, and its admin users, when matching a repo by commit hash';
	}

	get method() {
		return 'get';
	}

	// before the test runs...
	before(callback) {
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse(data) {
		if (this.expectEmpty) {
			Assert.deepStrictEqual(data, [], 'expected empty array');
			return;
		}
		Assert.strictEqual(data[0].repo.id, this.repo.id, 'returned repo should match the test repo');
		Assert.strictEqual(data[0].team.id, this.team.id, 'returned team should match the test team');
		const expectedAdminIds = [this.users[1].user.id];
		Assert.deepStrictEqual(data[0].admins.map(a => a.id), expectedAdminIds, 'returned admins should match the team creator');
	}
}

module.exports = TeamLookupTest;
