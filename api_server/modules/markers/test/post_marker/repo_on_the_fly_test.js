'use strict';

const StreamOnTheFlyTest = require('./stream_on_the_fly_test');
const Assert = require('assert');
const NormalizeUrl = require(process.env.CS_API_TOP + '/modules/repos/normalize_url');

class RepoOnTheFlyTest extends StreamOnTheFlyTest {

	get description () {
		return 'should return a valid marker when creating a marker tied to a third-party post, creating a repo on the fly';
	}

	// form the data for the marker we'll create in the test
	makeMarkerData (callback) {
		// delete the stream ID and the repo ID, and create a new remote URL to create a repo and stream on the fly
		super.makeMarkerData(() => {
			delete this.data.repoId;
			this.data.remotes = [this.repoFactory.randomUrl()];
			callback();
		});
	}

	validateResponse (data) {
		const repo = data.repo;
		Assert.notEqual(repo._id, this.repo._id, 'repo was not created');
		Assert.equal(repo.remotes[0].url, NormalizeUrl(this.data.remotes[0]), 'remotes of created repo do not match the given remotes');
		this.onTheFlyRepo = repo;
		super.validateResponse(data);
	}
}

module.exports = RepoOnTheFlyTest;
