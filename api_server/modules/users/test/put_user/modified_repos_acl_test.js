'use strict';

const ModifiedReposTest = require('./modified_repos_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class ModifiedReposACLTest extends ModifiedReposTest {

	get description () {
		return 'should return an error when trying to update the modifiedRepos for a team the user is not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'user can not set modifiedRepos for team'
		};
	}

	// form the data for the post update
	makeUserData (callback) {
		BoundAsync.series(this, [
			super.makeUserData,
			this.makeOtherTeam
		], callback);
	}

	makeOtherTeam (callback) {
		this.teamFactory.createRandomTeam(
			(error, response) => {
				if (error) { return callback(error); }
				this.data.modifiedRepos = { 
					[response.team.id]: this.data.modifiedRepos[this.team.id]
				};
				callback();
			},
			{
				token: this.users[1].accessToken
			}
		);
	}
}

module.exports = ModifiedReposACLTest;
