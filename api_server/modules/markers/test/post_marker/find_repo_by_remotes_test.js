'use strict';

const PostMarkerTest = require('./post_marker_test');

class FindRepoByRemotesTest extends PostMarkerTest {

	constructor (options) {
		super(options);

		// create some random remote URLs to add to the test repo
		this.wantRemotes = [];
		for (let i = 0; i < 4; i++) {
			this.wantRemotes.push(this.repoFactory.randomUrl());
		}

		// then specify a subset of these when submitting the test post, we should
		// then match on the repo instead of creating a new one
		this.useRemotes = [this.wantRemotes[1], this.wantRemotes[3]];
	}

	get description () {
		return 'should return a valid marker and match with the appropriate repo when creating a marker and specifying remotes from that repo';
	}

	// form the data for the marker we'll create in the test
	makeMarkerData (callback) {
		// delete the repo ID, and provide a subset of the remotes associated with the repo
		super.makeMarkerData(() => {
			delete this.data.repoId;
			this.data.remotes = this.useRemotes;
			callback();
		});
	}
}

module.exports = FindRepoByRemotesTest;
