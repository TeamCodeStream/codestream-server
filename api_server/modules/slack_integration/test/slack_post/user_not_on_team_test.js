'use strict';

var SlackPostTest = require('./slack_post_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class UserNotOnTeamTest extends SlackPostTest {

	get description () {
		return 'should return an error when trying to send a slack post request from a user who is not on the team that owns the stream';
	}

	getExpectedError () {
		return {
			code: 'SLIN-1005',
		};
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,	// create an unrelated user
			super.before			// normal test setup
		], callback);
	}

	// create a registered but unrelated user
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.otherUserData = response;
				callback();
			}
		);
	}

	// make the data to be used in the request that triggers the message
	makePostData (callback) {
		super.makePostData(() => {
			// inject the other user's email and username
			this.data.authorEmail = this.otherUserData.user.email;
			this.data.authorUsername = this.otherUserData.user.username;
			callback();
		});
	}
}

module.exports = UserNotOnTeamTest;
