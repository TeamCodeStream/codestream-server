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
			this.baseUrl = `ABC${RandomString.generate(8)}.CoM`;
			this.data.url = `wWw.${this.baseUrl}/?x=1&y=2#frag`;
			callback();
		});
	}

	validateResponse (data) {
		this.data.url = 'http://' + this.baseUrl.toLowerCase();
		super.validateResponse(data);
	}
}

module.exports = NormalizeUrlTest;
