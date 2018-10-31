'use strict';

const MarkerStreamOnTheFlyTest = require('./marker_stream_on_the_fly_test');
const Assert = require('assert');
const NormalizeURL = require(process.env.CS_API_TOP + '/modules/repos/normalize_url');
const Path = require('path');

class CreateRepoOnTheFlyTest extends MarkerStreamOnTheFlyTest {

	constructor (options) {
		super(options);

		// create some random remote URLs to generate a new repo
		this.useRemotes = [];
		for (let i = 0; i < 3; i++) {
			this.useRemotes.push(this.repoFactory.randomUrl());
		}
	}

	get description () {
		return 'should return a valid post and create a repo on the fly when creating a post referencing a marker from another stream and specifying remotes that do not match an existing repo';
	}

	// validate the response to the test request
	validateResponse (data) {
		const stream = data.streams[0];
		const repo = data.repos[0];
		const marker = data.markers[0];
		Assert.equal(repo._id, stream.repoId, 'ID of created repo does not match the repoId of the created stream');
		Assert.notEqual(repo._id, this.repo._id, 'returned repo has ID that equals the test repo');
		Assert.equal(marker.streamId, stream._id, 'streamId of created marker does not match the ID of the created stream');
		const repoRemotes = repo.remotes.map(remote => remote.normalizedUrl);
		repoRemotes.sort();
		const sentRemotes = this.useRemotes.map(remote => NormalizeURL(remote));
		sentRemotes.sort();
		Assert.deepEqual(repoRemotes, sentRemotes, 'remotes in the returned repo do not match the remotes sent with the request');
		const firstNormalizedRemote = NormalizeURL(this.useRemotes[0]);
		const parsedPath = Path.parse(firstNormalizedRemote);
		const expectedName = parsedPath.name;
		Assert.equal(repo.name, expectedName, 'repo name does not match the expected name');
		this.createdRepo = repo;
		super.validateResponse(data);
	}
}

module.exports = CreateRepoOnTheFlyTest;
