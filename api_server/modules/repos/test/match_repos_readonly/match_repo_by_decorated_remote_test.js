'use strict';

const MatchRepoTest = require('./match_repo_test');

class MatchRepoByDecoratedRemoteTest extends MatchRepoTest {

	get description () {
		return 'should return the repo, when matching a known repo by a decorated remote (read-only)';
	}

	getRequestData () {
		const data = super.getRequestData();
		data.repos[0].remotes[0] = `https://${this.repo.remotes[0].normalizedUrl}?x=1`;
		return data;
	}
}

module.exports = MatchRepoByDecoratedRemoteTest;
