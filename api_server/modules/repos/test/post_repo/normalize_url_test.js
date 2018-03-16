'use strict';

var PostRepoTest = require('./post_repo_test');
var RandomString = require('randomstring');

class NormalizeUrlTest extends PostRepoTest {

	get description () {
		return 'should return valid repo when creating a new repo, and the URL should be appropriately normalized';
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// form a kind of whacky url to use when creating the repo, we should still get a reasonable normalized url in the response
			this.basePath = `${RandomString.generate(8)}.CoM/${RandomString.generate(8)}/${RandomString.generate(5)}/${RandomString.generate(6)}`;
			this.data.url = `hTtPs://uSEr@${this.basePath}/?x=1&y=2#frag`;
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		// check for the properly normalized url in the response
		this.data.normalizedUrl = this.basePath.toLowerCase();
		super.validateResponse(data);
	}
}

module.exports = NormalizeUrlTest;
