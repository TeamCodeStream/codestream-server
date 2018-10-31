'use strict';

const FindRepoByRemotesTest = require('./find_repo_by_remotes_test');
const Assert = require('assert');
const NormalizeUrl = require(process.env.CS_API_TOP + '/modules/repos/normalize_url');

class UpdateMatchedRepoWithRemotesTest extends FindRepoByRemotesTest {

	constructor (options) {
		super(options);

		// add a couple of remotes to the remotes we'll use for the test request, 
		// these remotes should be added to the url as indicated by an update op in the response
		this.remotesAdded = [
			this.repoFactory.randomUrl(),
			this.repoFactory.randomUrl()
		];
		this.useRemotes = this.useRemotes.concat(this.remotesAdded);
	}

	get description () {
		return 'when a marker has remotes that match an existing repo, but has new remotes as well, those new remotes should be added to the known remotes for the repo';
	}

	// validate the response to the test request
	validateResponse (data) {
		const repo = data.repos[0];
		Assert.equal(repo._id, this.repo._id, 'got repo that does not match the test repo');
		const remotesPushed = repo.$push.remotes.map(remote => remote.normalizedUrl);
		remotesPushed.sort();
		const remotesAdded = this.remotesAdded.map(remote => NormalizeUrl(remote));
		remotesAdded.sort();
		Assert.deepEqual(remotesPushed, remotesAdded, 'remotes pushed does not match the remotes added by the request');
		super.validateResponse(data);
	}
}

module.exports = UpdateMatchedRepoWithRemotesTest;
