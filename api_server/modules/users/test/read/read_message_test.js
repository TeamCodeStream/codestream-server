'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class ReadMessageTest extends CodeStreamMessageTest {

	get description () {
		return 'the user should receive a message on their me-channel when they indicate they have read all messages in a stream';
	}

	// make the data we need to perform the test...
	makeData (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,		// create a second registered user
			this.createRepo,			// create a repo (and team)
			this.createStream,			// create a stream in the repo
			this.createOtherStream,		// create a second stream in the repo (control stream)
			this.createPost,			// create a post in the first stream
			this.createOtherPost		// create a post in the second stream
		], callback);
	}

	// create a second registered user
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	// create a repo and team
	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				callback();
			},
			{
				withEmails: [this.currentUser.email],	// include the "current" user
				token: this.otherUserData.accessToken	// "other" user creates the repo/team
			}
		);
	}

	// create a file-type stream in the repo
	createStream (callback) {
		let streamOptions = {
			type: 'channel',
			teamId: this.team._id,
			memberIds: [this.currentUser._id],	// include the "current" user in the stream
			token: this.otherUserData.accessToken	// "other" user creates the stream
		};
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			streamOptions
		);
	}

	// create a second file-type stream in the repo
	createOtherStream (callback) {
		let streamOptions = {
			type: 'channel',
			teamId: this.team._id,
			memberIds: [this.currentUser._id],	// include the "current" user in the stream
			token: this.otherUserData.accessToken	// "other" user creates the stream
		};
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherStream = response.stream;
				callback();
			},
			streamOptions
		);
	}

	// create a post in the stream
	createPost (callback) {
		let postOptions = {
			streamId: this.stream._id,
			token: this.otherUserData.accessToken	// "other" user is the author of the post
		};
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.post = response.post;
				callback();
			},
			postOptions
		);
	}

	// create a post in the second stream
	createOtherPost (callback) {
		let postOptions = {
			streamId: this.otherStream._id,			// "second" stream
			token: this.otherUserData.accessToken	// "other" user is the author of the post
		};
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherPost = response.post;
				callback();
			},
			postOptions
		);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// should come back through the user's me-channel
		this.channelName = 'user-' + this.currentUser._id;
		callback();
	}

	// issue the api request that triggers the message
	generateMessage (callback) {
		// indicate we have "read" the first stream
		this.doApiRequest(
			{
				method: 'put',
				path: '/read/' + this.stream._id,
				token: this.token
			},
			error => {
				if (error) { return callback(error); }
				// we expect a message the unset the lastReads value for this stream
				this.message = {
					user: {
						_id: this.currentUser._id,
						'$unset': {
							['lastReads.' + this.stream._id]: true
						}
					}
				};
				callback();
			}
		);
	}
}

module.exports = ReadMessageTest;
