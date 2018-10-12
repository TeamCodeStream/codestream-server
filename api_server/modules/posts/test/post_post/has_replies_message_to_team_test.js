'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class HasRepliesMessageToTeamTest extends CodeStreamMessageTest {

	get description () {
		return 'members of the team should receive a message with the parent post and hasReplies set to true when the first reply is created to the post in a file stream';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		BoundAsync.series(this, [
			this.createTeamCreator,	// create a user who will create the team (and repo)
			this.createStreamCreator,	// create a user who will create a stream in the team
			this.createPostCreator,	// create a user who will create a post in the stream
			this.createRepo,	// create the repo for the stream
			this.createStream,	// create the stream in the repo
			this.createParentPost,	// create the parent post, used when we create the test post as a reply to this one
			this.createFirstReply	// create a first reply to the parent post, as needed
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

	// create a file-type stream in the repo
	createStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			{
				type: 'file',
				teamId: this.team._id,
				repoId: this.repo._id,
				token: this.streamCreatorData.accessToken
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

	// create a first reply to the parent post, as needed
	createFirstReply (callback) {
		if (!this.wantFirstReply) {
			return callback();
		}
		this.postFactory.createRandomPost(
			callback,
			{
				token: this.streamCreatorData.accessToken,
				streamId: this.stream._id,
				parentPostId: this.parentPost._id
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
		const postOptions = this.getPostOptions();
		// create a post in the file stream, this should trigger a message to the
		// team channel with the newly created post
		const numRepliesExpected = this.wantFirstReply ? 2 : 1;
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
							numReplies: numRepliesExpected
						}
					}
				};
				callback();
			},
			postOptions
		);
	}

	getPostOptions () {
		return {
			token: this.postCreatorData.accessToken,	// the "post creator" creates the post
			teamId: this.team._id,
			streamId: this.stream._id,
			parentPostId: this.parentPost._id
		};
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

module.exports = HasRepliesMessageToTeamTest;
