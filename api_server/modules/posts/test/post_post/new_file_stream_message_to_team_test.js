'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class NewFileStreamMessageToTeamTest extends CodeStreamMessageTest {

	get description () {
		return 'members of the team should receive a message with the stream when a post is posted to a file stream created on the fly';
	}

	// make the data that triggers the message to be messageReceived
	makeData (callback) {
		BoundAsync.series(this, [
			this.createTeamCreator,	// create a user who will create the team (and repo)
			this.createPostCreator,	// create a user who will create a post (and a stream on the fly)
			this.createRepo			// create a repo
		], callback);
	}

	// create a user who will then create a team and repo
	createTeamCreator (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.teamCreatorData = response;
				callback();
			}
		);
	}

	// create a user who will then create a post
	createPostCreator (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.postCreatorData = response;
				callback();
			}
		);
	}

	// create a repo
	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.repo = response.repo;
				callback();
			},
			{
				withEmails: [
					this.currentUser.email,
					this.postCreatorData.user.email
				],	// include me, and the user who will create the post
				withRandomEmails: 1,	// include another random user, for good measure
				token: this.teamCreatorData.accessToken	// the "team creator" creates the repo (and team)
			}
		);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// it is the team channel
		this.channelName = 'team-' + this.team._id;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// we'll create a post and a file-type stream "on-the-fly" ...
		// this should trigger a message to the team channel that
		// indicates the stream was created
		let streamOptions = {
			type: 'file',
			file: this.streamFactory.randomFile(),
			teamId: this.team._id,
			repoId: this.repo._id,
		};
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.message = { stream: response.stream };	// the message should look like this
				callback();
			},
			{
				token: this.postCreatorData.accessToken,	// the "post creator"
				teamId: this.team._id,
				wantCodeBlocks: 1,		// let's do a code block for good measure
				stream: streamOptions
			}
		);
	}
}

module.exports = NewFileStreamMessageToTeamTest;
