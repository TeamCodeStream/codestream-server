'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class NewTeamStreamMessageToTeamTest extends CodeStreamMessageTest {

	get description () {
		return 'members of the team should receive a message with the stream when a team stream is added to the team';
	}

	// make the data to use for the test
	makeData (callback) {
		BoundAsync.series(this, [
			this.createTeamCreator,		// create a user who will create a team and repo
			this.createStreamCreator,	// create a user who will create a stream
			this.createRepo 			// create a repo to use for the test
		], callback);
	}

	// create a user who will create a team and repo
	createTeamCreator (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.teamCreatorData = response;
				callback();
			}
		);
	}

	// create a user who will create a stream
	createStreamCreator (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.streamCreatorData = response;
				callback();
			}
		);
	}

	// create a repo to use for the test
	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.repo = response.repo;
				callback();
			},
			{
				withEmails: [this.currentUser.email, this.streamCreatorData.user.email],	// current user and stream creator are included
				withRandomEmails: 1,	// add another user for good measure
				token: this.teamCreatorData.accessToken	// team creator creates the team
			}
		);
	}

	// set the name of the channel to listen for the message on
	setChannelName (callback) {
		// when a file-type stream is created, we should get a message on the team channel
		this.channelName = 'team-' + this.team._id;
		callback();
	}

	// issue the request that will trigger the message to be sent
	generateMessage (callback) {
		// create a file-type stream, this should send a message on the team channel
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.message = { stream: response.stream };	// expect the stream as the message
				callback();
			},
			{
				token: this.streamCreatorData.accessToken,	// stream creator creates the stream
				teamId: this.team._id,
                type: 'channel',
                isTeamStream: true
			}
		);
	}
}

module.exports = NewTeamStreamMessageToTeamTest;
