'use strict';

const ModifiedReposTest = require('./modified_repos_test');

class CompactModifiedReposTest extends ModifiedReposTest {

	constructor (options) {
		super(options);
		this.setCompactModifiedRepos = true;
	}
}

module.exports = CompactModifiedReposTest;
