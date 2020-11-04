'use strict';

const ModifiedReposFetchTest = require('./modified_repos_fetch_test');

class CompactModifiedReposFetchTest extends ModifiedReposFetchTest {

	constructor(options) {
		super(options);
		this.setCompactModifiedRepos = true;
	}
}

module.exports = CompactModifiedReposFetchTest;
