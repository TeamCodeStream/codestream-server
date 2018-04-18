'use strict';

const TeamsPostMessageTest = require('./teams_post_message_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class UserAddedMessageTest extends TeamsPostMessageTest {

	constructor (options) {
		super(options);
		this.dontIncludeOtherUser = true;  // don't include the post originator in the test team
	}

	get description () {
		return 'when a teams post call is made, and if the user was a known user who is not on the team that owns the stream, that user should be added to the team and the user should be in the published message';
	}

	// make the data to be used for the test...
	makeData (callback) {
		BoundAsync.series(this, [
			super.makeData,
			this.createForeignRepo
		], callback);
	}

	// have the user who originates the post in the test have a separate team to themselves
	createForeignRepo (callback) {
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

	// validate the message received
	validateMessage (message) {
		const subMessage = message.message;
		// validate that we got the user with the response, matching the expected email and username
		Assert(subMessage.users, 'no users sent with message');
		const user = subMessage.users[0];
		Assert.equal(user.email, this.data.authorEmail, 'returned user doesn\'t match author email');
		Assert.equal(user.username, this.data.authorUsername, 'returned user doesn\t match author username');
		Assert.deepEqual(user.teamIds.sort(), [this.foreignTeam._id, this.team._id].sort(), 'teams in returned user are not correct');
		// prepare to do a comparison with the expected message....
		this.message.users = subMessage.users;
		return super.validateMessage(message);
	}
}

module.exports = UserAddedMessageTest;
