'use strict';

var FindRepoTest = require('./find_repo_test');

class NormalizeTest extends FindRepoTest {

	get description () {
		return 'should find the appropriate repo even if the url is non-normalized';
	}

	makePath (callback) {
		let url = decodeURIComponent(this.queryData.url);
		let match = url.match(/^https:\/\/(.+)@(.+)\?(.*)/);
		this.queryData.url = encodeURIComponent(`https://${match[2]}?x=a&y=b#def`).toUpperCase();
		this.queryData.firstCommitHash = this.queryData.firstCommitHash.toUpperCase();
		super.makePath(callback);
	}
}

module.exports = NormalizeTest;
