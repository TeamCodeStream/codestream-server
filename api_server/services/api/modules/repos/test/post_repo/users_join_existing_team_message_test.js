'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/services/api/modules/messager/test/codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class UsersJoinExistingTeamMessageTest extends CodeStreamMessageTest {

	get description () {
		return 'users added to a team when a repo is introduced should receive a message that they have been added to the team';
	}

	makeData (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,
			this.createRepo
		], callback);
	}

	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				callback();
			},
			{
				withRandomEmails: 1,
				token: this.otherUserData.accessToken
			}
		);
	}

	setChannelName (callback) {
		this.channelName = 'user-' + this.currentUser._id;
		callback();
	}


	generateMessage (callback) {
		this.repoFactory.createRandomRepo(
			error => {
				if (error) { return callback(error); }
				this.message = {
					users: [{
						_id: this.currentUser._id,
						$add: {
							teamIds: this.team._id
						}
					}]
				};
				callback();
			},
			{
				teamId: this.team._id,
				withEmails: [this.currentUser.email],
				withRandomEmails: 1,
				token: this.otherUserData.accessToken
			}
		);
	}
}

module.exports = UsersJoinExistingTeamMessageTest;
