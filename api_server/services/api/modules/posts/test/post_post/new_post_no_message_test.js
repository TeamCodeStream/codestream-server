'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/services/api/modules/messager/test/codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Assert = require('assert');
class NewPostNoMessageTest extends CodeStreamMessageTest {

	get description () {
		return `members of the team who are not members of the stream should not receive a message with the post when a post is posted to a ${this.type} stream`;
	}

	// make the data that triggers the message to be messageReceived
	makeData (callback) {
		BoundAsync.series(this, [
			this.createTeamCreator,	// create a user who will create the team (and repo)
			this.createStreamCreator,	// create a user who will create a stream in the team
			this.createPostCreator,	// create a user who will create a post in the stream
			this.createRepo,	// create the repo for the stream
			this.createStream	// create the stream in the repo
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

	// create a user who will then create a stream in the team we already created
	createStreamCreator (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.streamCreatorData = response;
				callback();
			}
		);
	}

	// create a user who will create a post in the stream we already created
	createPostCreator (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.postCreatorData = response;
				callback();
			}
		);
	}

	// create the repo to use in the test
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
					this.streamCreatorData.user.email,
					this.postCreatorData.user.email
				],	// include me, the creator of the stream, and the creator of the post
				withRandomEmails: 1,	// include another random user for good measure
				token: this.teamCreatorData.accessToken	// the "team creator"
			}
		);
	}

	// create a channel or direct stream in the team
	createStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			{
				type: this.type,
				teamId: this.team._id,
				memberIds: [
					this.postCreatorData.user._id,
					this.teamCreatorData.user._id
				],	// note - current user is NOT included in the stream
				token: this.streamCreatorData.accessToken	// the "stream creator" creates the stream
			}
		);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// listen on the team channel, but the message should go to the stream channel
		this.channelName = 'team-' + this.team._id;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// create a post in the stream, this should trigger a message to the
		// stream channel but NOT the team channel
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.message = { post: response.post };
				callback();
			},
			{
				token: this.postCreatorData.accessToken,
				teamId: this.team._id,
				streamId: this.stream._id
			}
		);
	}

	// called if message doesn't arrive after timeout, in this case, this is what we want
	messageTimeout () {
		this.messageCallback();
	}

	// called when a message has been received, in this case this is bad
	messageReceived (error) {
		if (error) { return this.messageCallback(error); }
		Assert.fail('message was received');
	}
}

module.exports = NewPostNoMessageTest;
