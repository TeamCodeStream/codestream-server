'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class NewStreamToMembersTest extends CodeStreamMessageTest {

	get description () {
		return `members of the stream should receive a message with the stream when a ${this.type} stream is added to a team`;
	}

	makeData (callback) {
		BoundAsync.series(this, [
			this.createTeamCreator,
			this.createStreamCreator,
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

	createStreamCreator (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.streamCreatorData = response;
				callback();
			}
		);
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
				withEmails: [this.currentUser.email, this.streamCreatorData.user.email],
				withRandomEmails: 1,
				token: this.teamCreatorData.accessToken
			}
		);
	}

	setChannelName (callback) {
		this.channelName = 'user-' + this.currentUser._id;
		callback();
	}


	generateMessage (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.message = { stream: response.stream };
				callback();
			},
			{
				type: this.type,
				token: this.streamCreatorData.accessToken,
				teamId: this.team._id,
				memberIds: [this.currentUser._id]
			}
		);
	}
}

module.exports = NewStreamToMembersTest;
