'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/services/api/modules/messager/test/codestream_message_test');

class UsersJoinNewTeamMessageTest extends CodeStreamMessageTest {

	get description () {
		return 'users added to a team when a repo and team are created should receive a message that they have been added to the team';
	}

	makeData (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.otherUserData = response;
				callback();
			}
		);
	}

	setChannelName (callback) {
		this.channelName = 'user-' + this.currentUser._id;
		callback();
	}


	generateMessage (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.message = {
					users: [{
						_id: this.currentUser._id,
						$add: {
							teamIds: response.team._id
						}
					}]
				};
				callback();
			},
			{
				withEmails: [this.currentUser.email],
				withRandomEmails: 1,
				token: this.otherUserData.accessToken
			}
		);
	}
}

module.exports = UsersJoinNewTeamMessageTest;
