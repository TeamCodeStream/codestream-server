'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const RepoTestConstants = require('../repo_test_constants');

class GetRepoTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
		//this.streamOptions.creatorIndex = 1;
		this.repoOptions.creatorIndex = 0;
	}

	get description () {
		return 'should return a valid repo when requesting a repo created by me';
	}

	getExpectedFields () {
		return { repo: RepoTestConstants.EXPECTED_REPO_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.setPath
		], callback);
	}

	// set the path for the test request
	setPath (callback) {
		// fetch the repo (created by submitting a post with a marker and remotes)
		this.path = '/repos/' + this.repo.id;
		callback();
	}

	// validate the response to the test request
	validateResponse (data) {
		// make sure we got the expected repo
		this.validateMatchingObject(this.repo.id, data.repo, 'repo');
		// make sure we didn't get attributes not suitable for the client 
		this.validateSanitized(data.repo, RepoTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetRepoTest;
