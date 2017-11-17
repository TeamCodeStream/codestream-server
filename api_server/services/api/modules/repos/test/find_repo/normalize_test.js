'use strict';

var FindRepoTest = require('./find_repo_test');

class NormalizeTest extends FindRepoTest {

	get description () {
		return 'should find the appropriate repo even if the url is non-normalized';
	}

	makePath (callback) {
		let url = decodeURIComponent(this.queryData.url);
		let match = url.match(/^https:\/\/(.+)/);
		this.queryData.url = encodeURIComponent(`https://www.${match[1]}?x=1&y=2#abc`).toUpperCase();
		this.queryData.firstCommitHash = this.queryData.firstCommitHash.toUpperCase();
		super.makePath(callback);
	}
}

module.exports = NormalizeTest;
