'use strict';

const ReviewTest = require('./review_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const TestTeamCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/test_team_creator');

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
				creatorIndex: undefined,
				creatorToken: this.users[1].accessToken,
				members: [this.currentUser.user.email],
				numAdditionalInvites: 0
			}),
			userOptions: this.userOptions,
			repoOptions: { 
				creatorToken: 'teamCreatorToken'
			}
		}).create((error, response) => {
			if (error) { return callback(error); }
			this.data.review.reviewChangesets[0].repoId = response.repo.id;
			callback();
		});
	}
}

module.exports = RepoFromWrongTeamInChangesetTest;
