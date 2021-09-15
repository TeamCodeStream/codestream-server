// base class for many tests of the "PUT /repos/match/:teamId" requests

'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');

class MatchRepoTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return the repo, when matching a known repo by remote (read-only)';
	}

	get method () {
		return 'get';
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		const expectedRepos = this.expectedRepos || [this.repo];
		Assert.deepEqual(data.repos, expectedRepos, 'incorrect repos returned in response');
	}
}

module.exports = MatchRepoTest;
