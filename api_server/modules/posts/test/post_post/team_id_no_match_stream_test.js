'use strict';

const PostPostTest = require('./post_post_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const TestTeamCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/test_team_creator');

class TeamIdNoMatchStreamTest extends PostPostTest {

	get description () {
		return 'should return an error when trying to create a post in a stream where the given team ID does not match the team of the stream';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1012',
			reason: 'teamId does not match the stream'
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
			this.data.teamId = response.team.id;
			callback();
		});
	}
}

module.exports = TeamIdNoMatchStreamTest;
