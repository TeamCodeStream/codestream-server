'use strict';

const MatchRepoTest = require('./match_repo_test');

class AddRemoteTest extends MatchRepoTest {

	get description () {
		return 'when matching a known repo and providing an additional remote, in read-only mode, the remote should NOT be added to the repo';
	}

	getRequestData () {
		const data = super.getRequestData();
		const addedRemote = this.repoFactory.randomUrl();
		data.repos[0].remotes.push(addedRemote);
		return data;
	}
}

module.exports = AddRemoteTest;
