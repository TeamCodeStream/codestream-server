'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class NewStreamToMembersTest extends CodeStreamMessageTest {

	get description () {
		return `members of the stream should receive a message with the stream when a ${this.type} stream is added to a team`;
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
		// listen on the current user's me-channel, they should get a message that they have been
		// added to the team
		this.channelName = 'user-' + this.currentUser._id;
		callback();
	}

	// issue the request that will trigger the message to be sent
	generateMessage (callback) {
		// create a channel or direct stream, this should send a message to the users that they've been 
		// added to the stream
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.message = { stream: response.stream };
				callback();
			},
			{
				type: this.type,
				token: this.streamCreatorData.accessToken,	// stream creator creates the stream, and ...
				teamId: this.team._id,
				memberIds: [this.currentUser._id]			// ... adds the current user
			}
		);
	}
}

module.exports = NewStreamToMembersTest;
