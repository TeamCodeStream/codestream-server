'use strict';

const CreateRepoOnTheFlyTest = require('./create_repo_on_the_fly_test');

class CreateRepoOnTheFlyWithCommitHashesTest extends CreateRepoOnTheFlyTest {

	constructor (options) {
		super(options);

		// create some random commit hashes to go along with creating the repo
		this.useKnownCommitHashes = [];
		for (let i = 0; i < 5; i++) {
			this.useKnownCommitHashes.push(this.markerFactory.randomCommitHash());
		}
		this.useCommitHash = this.markerFactory.randomCommitHash();
	}

	get description () {
		return 'should return a codemark directive and markers and create a repo on the fly when adding markers to a codemark and specifying remotes that do not match an existing repo, along with known commit hashes';
	}
}

module.exports = CreateRepoOnTheFlyWithCommitHashesTest;
