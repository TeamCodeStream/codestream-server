'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class UsersJoinExistingRepoMessageTest extends CodeStreamMessageTest {

	get description () {
		return 'users added to a team when a repo that already exists is introduced should receive a message that they have been added to the team';
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
				this.repo = response.repo;
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
		let repoData = {
			teamId: this.team._id,
			url: this.repo.url,
			firstCommitHash: this.repo.firstCommitHash,
			emails: [this.currentUser.email]
		};
		this.repoFactory.createRepo(
			repoData,
			this.otherUserData.accessToken,
			(error, response) => {
				if (error) { return callback(error); }
				this.message = response;
				let currentUser = this.message.users.find(user => user._id === this.currentUser._id);
				delete currentUser.teamIds;
				delete currentUser.companyIds;
				currentUser.$addToSet = {
					teamIds: response.repo.teamId,
					companyIds: response.repo.companyId
				};
				callback();
			}
		);
	}
}

module.exports = UsersJoinExistingRepoMessageTest;
