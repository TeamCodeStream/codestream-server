'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class HasRepliesMessageToStreamTest extends CodeStreamMessageTest {

	get description () {
		return `members of a ${this.type} stream should receive a message with the parent post and hasReplies set to true when the first reply is created to the post`;
	}

	// make the data that triggers the message to be messageReceived
	makeData (callback) {
		BoundAsync.series(this, [
			this.createTeamCreator,	// create a user who will create the team (and repo)
			this.createStreamCreator,	// create a user who will create a stream in the team
			this.createPostCreator,	// create a user who will create a post in the stream
			this.createRepo,	// create the repo for the stream
			this.createStream,	// create the stream in the repo
			this.createParentPost	// create the parent post, used when we create the test post as a reply to this one
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
					this.streamCreatorData.user.email,
					this.postCreatorData.user.email
				],	// include me, the creator of the stream, and the creator of the post
				withRandomEmails: 1,	// include another random user, for good measure
				token: this.teamCreatorData.accessToken	// the "team creator" creates the repo (and team)
			}
		);
	}

	// create a file-type stream in the repo
	createStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			{
				type: this.type,
				token: this.streamCreatorData.accessToken,	// the "stream creator" creates the stream
				teamId: this.team._id,
				memberIds: [
					this.currentUser._id,
					this.postCreatorData.user._id
				], // include me and the post creator
			}
		);
	}

	// create the parent post, the test post will be a reply to this post
	createParentPost (callback) {
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.parentPost = response.post;
				callback();
			},
			{
				token: this.streamCreatorData.accessToken,	// the "stream creator" also creates the parent post
				streamId: this.stream._id
			}
		);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// it is the team channel
		this.channelName = 'stream-' + this.stream._id;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// we'll create a post as a reply to the parent post we already created ...
		// since the parent post had a code block, this should cause a message to
		// be sent on the the team channel indicating the numComments field for
		// the marker to the code block has been incremented
		let postOptions = {
			token: this.postCreatorData.accessToken,
			streamId: this.stream._id,
			parentPostId: this.parentPost._id
		};
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				// the message should look like this, indicating the hasReplies
				// attribute for the parent post has been set
				this.post = response.post;
				this.message = {
					post: {
						_id: this.parentPost._id,
						$set: { 
							hasReplies: true,
							numReplies: 1
						}
					}
				};
				callback();
			},
			postOptions
		);
	}

	// validate the message received against expectations
	validateMessage (message) {
		// make sure we ignore the original post ... we want to see the parent post
		if (message.message.post && message.message.post._id === this.post._id) {
			return false;
		}
		return super.validateMessage(message);
	}
}

module.exports = HasRepliesMessageToStreamTest;
