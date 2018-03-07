'use strict';

const SlackPostTest = require('./slack_post_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class UserAddedTest extends SlackPostTest {

	constructor (options) {
		super(options);
		this.dontIncludeOtherUser = true;  // don't include the post originator in the test team
	}

	get description () {
		return 'should create and return a post when trying to send a slack post request from a known user who is not on the team that owns the stream, that user should be added to the team';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createForeignRepo
		], callback);
	}

	createForeignRepo (callback) {
		// have the user who originates the post in the test have a separate team to themselves
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.foreignTeam = response.team;
				callback();
			},
			{
				token: this.postOriginatorData.accessToken
			}
		);
	}
}

module.exports = UserAddedTest;
