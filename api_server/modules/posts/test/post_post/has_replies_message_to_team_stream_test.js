'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class HasRepliesMessageToTeamStreamTest extends CodeStreamMessageTest {

	get description () {
		return 'members of a team stream should receive a message with the parent post and hasReplies set to true when the first reply is created to the post';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		BoundAsync.series(this, [
			this.createTeamCreator,	// create a user who will create the team (and repo)
			this.createPostCreator,	// create a user who will create a post in the stream
			this.createRepo,	// create the repo for the stream
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
				this.teamStream = response.streams[0];
				callback();
			},
			{
				withEmails: [
					this.currentUser.email,
					this.postCreatorData.user.email
				],	// include me, the creator of the stream, and the creator of the post
				withRandomEmails: 1,	// include another random user for good measure
				token: this.teamCreatorData.accessToken	// the "team creator"
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
				token: this.teamCreatorData.accessToken,	// the "team creator" also creates the parent post
				streamId: this.teamStream._id
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
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				// the message should look like this, indicating the hasReplies
				// attribute for the parent post has been set
				this.post = response.post;
				this.message = {
					post: {
						_id: this.parentPost._id,
						$set: { hasReplies: true }
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
			streamId: this.teamStream._id,
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

module.exports = HasRepliesMessageToTeamStreamTest;
