'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/services/api/modules/messager/test/codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class UsersAddedToTeamTest extends CodeStreamMessageTest {

	get description () {
		return 'users on the the team when new users are added to the team should receive a message with the new users';
	}

	makeData (callback) {
		BoundAsync.series(this, [
			this.createRepo,
			this.createOtherUser
		], callback);
	}

	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.repo = response.repo;
				callback();
			},
			{
				token: this.token,
				withRandomEmails: 1
			}
		);
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

	setChannelName (callback) {
		this.channelName = 'team-' + this.team._id;
		callback();
	}


	generateMessage (callback) {
		this.repoFactory.createRepo(
			{
				url: this.repo.url,
				firstCommitHash: this.repo.firstCommitHash,
				emails: [
					this.userFactory.randomEmail(),
					this.userFactory.randomEmail()
				]
			},
			this.otherUserData.accessToken,
			(error, response) => {
				if (error) { return callback(error); }
				let addedMemberIds = response.users.map(user => user._id);
				this.message = {
					users: response.users,
					team: {
						_id: this.team._id,
						$addToSet: {
							memberIds: addedMemberIds
						}
					}
				};
				callback();
			}
		);
	}
}

module.exports = UsersAddedToTeamTest;
