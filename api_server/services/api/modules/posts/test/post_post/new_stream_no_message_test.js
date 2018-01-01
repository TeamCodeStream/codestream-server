'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/services/api/modules/messager/test/codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Assert = require('assert');
class NewStreamNoMessageTest extends CodeStreamMessageTest {

	get description () {
		return `members of the team who are not members of the stream should receive no message when a post is posted to a ${this.type} stream created on the fly`;
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

	// create a repo for the test
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
				],	// include the current user and the post creator in the team
				withRandomEmails: 1,	// include another random user, for good measure
				token: this.teamCreatorData.accessToken	// the "team creator" creates the team
			}
		);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// the stream is being created on the fly, but members of the team
		// owning the stream should see no message on the team channel
		this.channelName = 'team-' + this.team._id;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// create a post and specify to create a stream on the fly ...
		// this should trigger a message to the users in the stream but
		// NOT the team channel
		let streamOptions = {
			type: this.type,
			name: this.type === 'channel' ? this.teamFactory.randomName() : null,
			teamId: this.team._id,
			memberIds: [this.teamCreatorData.user._id]
		};
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.message = { stream: response.stream };
				callback();
			},
			{
				token: this.postCreatorData.accessToken,		// the "post creator" will create the post and the stream on the fly
				teamId: this.team._id,
				stream: streamOptions
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

module.exports = NewStreamNoMessageTest;
