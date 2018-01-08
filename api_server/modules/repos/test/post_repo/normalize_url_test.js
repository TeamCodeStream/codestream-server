'use strict';

var PostRepoTest = require('./post_repo_test');
var RandomString = require('randomstring');

class NormalizeUrlTest extends PostRepoTest {

	get description () {
		return `should return valid repo when creating a new repo, and the URL should be appropriately normalized`;
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.basePath = `${RandomString.generate(8)}.CoM/${RandomString.generate(8)}/${RandomString.generate(5)}/${RandomString.generate(6)}`;
			this.data.url = `hTtPs://uSEr@${this.basePath}/?x=1&y=2#frag`;
			callback();
		});
	}

	validateResponse (data) {
		this.data.normalizedUrl = this.basePath.toLowerCase();
		super.validateResponse(data);
	}
}

module.exports = NormalizeUrlTest;
