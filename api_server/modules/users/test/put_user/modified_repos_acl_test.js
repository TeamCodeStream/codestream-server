'use strict';

const ModifiedReposTest = require('./modified_repos_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class ModifiedReposACLTest extends ModifiedReposTest {

	get description () {
		const which = this.setCompactModifiedRepos ? 'compactModifiedRepos' : 'modifiedRepos';
		return `should return an error when trying to update the ${which} for a team the user is not a member of`;
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
		BoundAsync.series(this, [
			super.makeUserData,
			this.makeOtherTeam
		], callback);
	}

	makeOtherTeam (callback) {
		this.companyFactory.createRandomCompany(
			(error, response) => {
				if (error) { return callback(error); }
				const which = this.setCompactModifiedRepos ? 'compactModifiedRepos' : 'modifiedRepos';
				this.data[which] = { 
					[response.team.id]: this.data[which][this.team.id]
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
