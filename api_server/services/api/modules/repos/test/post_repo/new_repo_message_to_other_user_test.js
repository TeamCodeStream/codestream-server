'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/services/api/modules/messager/test/codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class NewRepoMessageToOtherUserTest extends CodeStreamMessageTest {

	get description () {
		return 'users on a team should receive a message with the repo when a repo is added to the team';
	}

	makeData (callback) {
		BoundAsync.series(this, [
			this.createTeamCreator,
			this.createPostingUser,
			this.createRepo
		], callback);
	}

	createTeamCreator (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.teamCreatorData = response;
				callback();
			}
		);
	}

	createPostingUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.postingUserData = response;
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
				withEmails: [this.currentUser.email, this.postingUserData.user.email],
				withRandomEmails: 1,
				token: this.teamCreatorData.accessToken
			}
		);
	}

	setChannelName (callback) {
		this.channelName = 'team-' + this.team._id;
		callback();
	}


	generateMessage (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.message = { repo: response.repo };
				callback();
			},
			{
				token: this.postingUserData.accessToken,
				teamId: this.team._id
			}
		);
	}
}

module.exports = NewRepoMessageToOtherUserTest;
