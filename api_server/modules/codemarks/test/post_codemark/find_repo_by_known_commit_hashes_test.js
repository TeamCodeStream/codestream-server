'use strict';

const MarkerStreamOnTheFlyTest = require('./marker_stream_on_the_fly_test');

class FindRepoByKnownCommitHashesTest extends MarkerStreamOnTheFlyTest {

	constructor (options) {
		super(options);

		// create some random known commit hashes to add to the test repo
		this.repoOptions.withKnownCommitHashes = [];
		for (let i = 0; i < 5; i++) {
			this.repoOptions.withKnownCommitHashes.push(this.markerFactory.randomCommitHash());
		}

		// then specify a subset of these when submitting the test post, we should
		// then match on the repo instead of creating a new one
		this.useKnownCommitHashes = [this.repoOptions.withKnownCommitHashes[1], this.repoOptions.withKnownCommitHashes[3]];

		// we're not creating a repo on the fly, we should find the existing repo instead
		this.repoOnTheFly = false;

		// indicate we expect a match by commit hash, which changes the repo data we expect to receive
		this.expectMatchByKnownCommitHashes = true;
	}

	get description () {
		return 'should return a valid post and match with the appropriate repo when creating a codemark with a marker and specifying known commit hashes that match a known repo';
	}
}

module.exports = FindRepoByKnownCommitHashesTest;
