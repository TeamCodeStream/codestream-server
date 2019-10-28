// base class for many tests of the "PUT /repos/match/:teamId" requests

'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');

class MatchRepoTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return the repo, when matching a known repo by remote';
	}

	get method () {
		return 'put';
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		const expectedRepos = this.expectedRepos || [this.repo];
		for (let i = 0; i < expectedRepos.length; i++) {
			const expectedRepo = expectedRepos[i];
			const repo = data.repos[i];
			if (expectedRepo.modifiedAt === 0) {
				Assert(repo.modifiedAt >= this.modifiedAfter, `repo ${repo.id} modifiedAt field not set when expected`);
				expectedRepo.modifiedAt = repo.modifiedAt;
			}
		}
		Assert.deepEqual(data.repos, expectedRepos, 'incorrect repos returned in response');
	}
}

module.exports = MatchRepoTest;
