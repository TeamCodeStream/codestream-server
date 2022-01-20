'use strict';

const ModifiedReposTest = require('./modified_repos_test');
const ObjectId = require('mongodb').ObjectId;

class ModifiedReposInvalidTeamTest extends ModifiedReposTest {

	get description () {
		const which = this.setCompactModifiedRepos ? 'compactModifiedRepos' : 'modifiedRepos';
		return `should return an error when trying to update the ${which} for a non-existent team`;
	}

	getExpectedError () {
		const which = this.setCompactModifiedRepos ? 'compactModifiedRepos' : 'modifiedRepos';
		return {
			code: 'RAPI-1010',
			reason: `user can not set ${which} for team`
		};
	}

	// form the data for the post update
	makeUserData (callback) {
		super.makeUserData(() => {
			const which = this.setCompactModifiedRepos ? 'compactModifiedRepos' : 'modifiedRepos';
			this.data[which] = { 
				[ObjectId()]: this.data[which][this.team.id]
			};
			callback();
		});
	}
}

module.exports = ModifiedReposInvalidTeamTest;
