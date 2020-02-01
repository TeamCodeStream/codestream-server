'use strict';

const ReviewMarkerStreamOnTheFlyTest = require('./review_marker_stream_on_the_fly_test');

class ReviewCreateRepoOnTheFlyTest extends ReviewMarkerStreamOnTheFlyTest {

	constructor (options) {
		super(options);
		this.expectMarkers = 1;
		
		// create some random remote URLs to generate a new repo
		this.useRemotes = [];
		for (let i = 0; i < 3; i++) {
			this.useRemotes.push(this.repoFactory.randomUrl());
		}
	}

	get description () {
		return 'should return a valid post and create a repo on the fly when creating a post and review with a marker and specifying remotes that do not match an existing repo';
	}
}

module.exports = ReviewCreateRepoOnTheFlyTest;
