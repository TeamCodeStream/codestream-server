'use strict';

const GetPostsTest = require('./get_posts_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const TestTeamCreator = require(process.env.CS_API_TOP + '/lib/test_base/test_team_creator');

class RepoNoMatchTeamTest extends GetPostsTest {

	get description () {
		return 'should return an error when trying to fetch posts for a file where the team doesn\'t match the repo';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'repo'
		};
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createForeignTeam
		], callback);
	}

	// create a "foreign" team, for which the current user is not a member
	createForeignTeam (callback) {
		new TestTeamCreator({
			test: this,
			teamOptions: Object.assign({}, this.teamOptions, {
				creatorToken: this.users[1].accessToken
			}),
			userOptions: this.userOptions
		}).create((error, response) => {
			if (error) { return callback(error); }
			const path = encodeURIComponent(this.stream.path);
			this.path = `/posts?teamId=${response.team._id}&repoId=${this.repo._id}&path=${path}`;
			callback();
		});
	}
}

module.exports = RepoNoMatchTeamTest;
