'use strict';

const ModifiedReposTest = require('./modified_repos_test');

class NoCompactAndModifiedReposTest extends ModifiedReposTest {

	get description() {
		return 'should not be able to set modifiedRepos and compactModifiedRepos at the same time';
	}

	getExpectedError() {
		return {
			code: 'RAPI-1005',
			reason: 'cannot provide modifiedRepos and compactModifiedRepos at the same time'
		};
	}

	// form the data for the post update
	makeUserData(callback) {
		super.makeUserData(() => {
			this.data.compactModifiedRepos = {
				[this.team.id]: {
					a: 1
				}
			};
			callback();
		});
	}

}

module.exports = NoCompactAndModifiedReposTest;
