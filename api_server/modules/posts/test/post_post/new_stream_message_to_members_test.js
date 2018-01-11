'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class NewStreamMessageToMembersTest extends CodeStreamMessageTest {

	get description () {
		return `members of the stream should receive a message with the stream when a post is posted to a ${this.type} stream created on the fly`;
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		BoundAsync.series(this, [
			this.createTeamCreator,	// create a user who will create the team (and repo)
			this.createPostCreator,	// create a user who will create a post to a stream created on-the-fly
			this.createRepo,	// create the repo for the stream
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
				], // include me, and the user who will create the post in the team
				withRandomEmails: 1,	// include another random user, for good measure
				token: this.teamCreatorData.accessToken	// the "team creator" creates the repo (and team)
			}
		);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// each user should individually receive a message with the stream
		// the have now been added to
		this.channelName = 'user-' + this.currentUser._id;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// we'll create a post and a stream "on-the-fly" ...
		// this should trigger a message to the user channel
		// for every user in the stream, indicating they have been
		// added to a stream
		let streamOptions = {
			type: this.type,
			name: this.type === 'channel' ? this.teamFactory.randomName() : null,
			teamId: this.team._id,
			memberIds: [this.currentUser._id]	// include the current user in the stream
		};
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.message = { stream: response.stream };
				callback();
			},
			{
				token: this.postCreatorData.accessToken,	// the "post creator" will create the post and the stream on the fly
				teamId: this.team._id,
				stream: streamOptions
			}
		);
	}
}

module.exports = NewStreamMessageToMembersTest;
