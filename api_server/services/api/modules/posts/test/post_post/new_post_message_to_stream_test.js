'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/services/api/modules/messager/test/codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class NewPostMessageToStreamTest extends CodeStreamMessageTest {

	get description () {
		return `members of the stream should receive a message with the post when a post is posted to a ${this.type} stream`;
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

	// create a stream (direct or channel) in the team
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
					this.currentUser._id,
					this.postCreatorData.user._id
				], // include me and the post creator
				token: this.streamCreatorData.accessToken // the "stream creator"
			}
		);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// it is the stream channel
		this.channelName = 'stream-' + this.stream._id;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// create a post in the stream, this should trigger a message to the
		// stream channel with the newly created post
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.message = { post: response.post };	// the message should look like this
				callback();
			},
			{
				token: this.postCreatorData.accessToken,	// the "post creator" creates the post
				teamId: this.team._id,
				streamId: this.stream._id
			}
		);
	}
}

module.exports = NewPostMessageToStreamTest;
