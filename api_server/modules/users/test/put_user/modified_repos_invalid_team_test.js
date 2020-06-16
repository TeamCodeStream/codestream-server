'use strict';

const ModifiedReposTest = require('./modified_repos_test');
const ObjectID = require('mongodb').ObjectID;

class ModifiedReposInvalidTeamTest extends ModifiedReposTest {

	get description () {
		return 'should return an error when trying to update the modifiedRepos for a non-existent team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'user can not set modifiedRepos for team'
		};
	}

	// form the data for the post update
	makeUserData (callback) {
		super.makeUserData(() => {
			this.data.modifiedRepos = { 
				[ObjectID()]: this.data.modifiedRepos[this.team.id]
			};
			callback();
		});
	}
}

module.exports = ModifiedReposInvalidTeamTest;
