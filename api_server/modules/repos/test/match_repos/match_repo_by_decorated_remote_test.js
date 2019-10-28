'use strict';

const MatchRepoTest = require('./match_repo_test');

class MatchRepoByDecoratedRemoteTest extends MatchRepoTest {

	get description () {
		return 'should return the repo, when matching a known repo by a decorated remote';
	}

	makeRequestData (callback) {
		super.makeRequestData(error => {
			if (error) { return callback(error); }
			this.data.repos[0].remotes[0] = `https://${this.repo.remotes[0].normalizedUrl}?x=1`;
			callback();
		});
	}
}

module.exports = MatchRepoByDecoratedRemoteTest;
