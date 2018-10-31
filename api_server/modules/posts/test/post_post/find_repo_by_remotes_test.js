'use strict';

const MarkerStreamOnTheFlyTest = require('./marker_stream_on_the_fly_test');
const Assert = require('assert');

class FindRepoByRemotesTest extends MarkerStreamOnTheFlyTest {

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
		return 'should return a valid post and match with the appropriate repo when creating a post referencing a marker from another stream and specifying remotes';
	}

	// make the data to use when creating the post for the test request
	makePostData (callback) {
		// first we'll create another post, specifying some remotes ... this will
		// add those remotes to the list of remotes known for the repo, which
		// we should then match when we run the test
		this.postFactory.createRandomPost(
			error => {
				if (error) { return callback(error); }
				super.makePostData(callback);
			},
			{
				stream: {
					teamId: this.team._id,
					type: 'channel',
					name: this.streamFactory.randomName()
				},
				wantMarkers: 1,
				markerStream: {  // this creates a new stream and adds the remotes specified to the repo
					file: this.streamFactory.randomFile(),
					repoId: this.repo._id,
					remotes: this.wantRemotes
				},
				token: this.token
			}
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		const stream = data.streams[0];
		Assert.equal(stream.repoId, this.repo._id, 'created stream\'s repo ID does not match the created repo');
		super.validateResponse(data);
	}
}

module.exports = FindRepoByRemotesTest;
