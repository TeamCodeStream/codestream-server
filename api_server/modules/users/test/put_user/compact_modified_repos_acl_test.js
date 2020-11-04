'use strict';

const ModifiedReposACLTest = require('./modified_repos_acl_test');

class CompactModifiedReposACLTest extends ModifiedReposACLTest {

	constructor(options) {
		super(options);
		this.setCompactModifiedRepos = true;
	}
}

module.exports = CompactModifiedReposACLTest;
