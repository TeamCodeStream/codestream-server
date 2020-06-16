'use strict';

const MarkerStreamOnTheFlyTest = require('./marker_stream_on_the_fly_test');

class FindRepoByRemotesTest extends MarkerStreamOnTheFlyTest {

	constructor (options) {
		super(options);

		// create some random remote URLs to add to the test repo
		this.repoOptions.withRemotes = [];
		for (let i = 0; i < 4; i++) {
			this.repoOptions.withRemotes.push(this.repoFactory.randomUrl());
		}

		// then specify a subset of these when submitting the test post, we should
		// then match on the repo instead of creating a new one
		this.useRemotes = [this.repoOptions.withRemotes[1], this.repoOptions.withRemotes[3]];

		// we're not creating a repo on the fly, we should find the existing repo instead
		this.repoOnTheFly = false;
	}

	get description () {
		return 'should return a valid post and match with the appropriate repo when creating a post and codemark with a marker and specifying remotes';
	}
}

module.exports = FindRepoByRemotesTest;
