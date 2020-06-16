'use strict';

const MatchRepoTest = require('./match_repo_test');
const Assert = require('assert');

class CreateRepoTest extends MatchRepoTest {

	get description () {
		return 'should return a new repo, when trying to matching that is not a known repo for the team';
	}

	makeRequestData (callback) {
		super.makeRequestData(error => {
			if (error) { return callback(error); }
			this.unknownRemote = this.repoFactory.randomUrl();
			this.data.repos[0].remotes = [this.unknownRemote];
			callback();
		});
	}

	validateResponse (data) {
		const repo = data.repos[0];
		Assert.notEqual(repo.id, this.repo.id, 'should not have found the test repo');
		const remoteObject = this.getRemoteObject(this.unknownRemote);
		Assert.deepEqual(repo.remotes, [remoteObject], 'created repo should match the remote passed');
	}
}

module.exports = CreateRepoTest;
