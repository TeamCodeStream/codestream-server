'use strict';

const ReviewTest = require('./review_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const TestTeamCreator = require(process.env.CS_API_TOP + '/lib/test_base/test_team_creator');

class RepoFromWrongTeamInChangesetTest extends ReviewTest {

	get description () {
		return 'should return an error if a repo ID froma different team is included in the change set for a review that is included with a post';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'repo'
		};
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createForeignTeam
		], callback);
	}

	createForeignTeam (callback) {
		new TestTeamCreator({
			test: this,
			teamOptions: Object.assign({}, this.teamOptions, {
				creatorIndex: null,
				creatorToken: this.users[1].accessToken,
				members: [this.currentUser.user.email],
				numAdditionalInvites: 0
			}),
			userOptions: this.userOptions,
			repoOptions: { 
				creatorToken: this.users[1].accessToken
			}
		}).create((error, response) => {
			if (error) { return callback(error); }
			this.data.review.repoChangesets[0].repoId = response.repo.id;
			callback();
		});
	}
}

module.exports = RepoFromWrongTeamInChangesetTest;
