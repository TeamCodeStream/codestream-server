'use strict';

const MatchRepoTest = require('./match_repo_test');

class AddRemoteTest extends MatchRepoTest {

	get description () {
		return 'when matching a known repo and providing an additional remote, the remote should be added to the repo';
	}

	makeRequestData (callback) {
		super.makeRequestData(error => {
			if (error) { return callback(error); }
			const addedRemote = this.repoFactory.randomUrl();
			this.data.repos[0].remotes.push(addedRemote);
			this.expectedRepos = [Object.assign({}, this.repo, {
				version: 2,
				modifiedAt: 0 // placeholder
			})];
			this.expectedRepos[0].remotes.push(this.getRemoteObject(addedRemote));
			callback();
		});
	}
}

module.exports = AddRemoteTest;
