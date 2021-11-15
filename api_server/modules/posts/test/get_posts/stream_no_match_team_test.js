'use strict';

const GetPostsTest = require('./get_posts_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const TestTeamCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/test_team_creator');

class StreamNoMatchTeamTest extends GetPostsTest {

	get description () {
		return 'should return an error when trying to fetch posts from a stream where the team doesn\'t match';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1006',
			reason: 'teamId must match the team of the stream'
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
			this.path = `/posts?teamId=${response.team.id}&streamId=${this.teamStream.id}`;
			callback();
		});
	}
}

module.exports = StreamNoMatchTeamTest;
