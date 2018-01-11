'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class NumCommentsMessageTest extends CodeStreamMessageTest {

	get description () {
		return `members of the team should receive a message when the numComments attribute of a marker is incremented due to a reply to a post with markers`;
	}

	// make the data that triggers the message to be messageReceived
	makeData (callback) {
		BoundAsync.series(this, [
			this.createTeamCreator,	// create a user who will create the team (and repo)
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
				token: this.teamCreatorData.accessToken,	// the "team creator" creates the stream, too
				teamId: this.team._id,
				repoId: this.repo._id
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
				streamId: this.stream._id,
				wantCodeBlocks: true	// send code block which will create a marker
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
				// the message should look like this, indicating the numComments
				// attribute for the marker to the reply post has been incremented
				this.message = {
					post: response.post,
					markers: [{
						_id: this.parentPost.codeBlocks[0].markerId,
						$inc: { numComments: 1 }
					}]
				};
				callback();
			},
			postOptions
		);
	}
}

module.exports = NumCommentsMessageTest;
