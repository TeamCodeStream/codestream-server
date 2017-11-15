'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/services/api/modules/messager/test/codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Assert = require('assert');
class NewPostNoMessageTest extends CodeStreamMessageTest {

	get description () {
		return `members of the team who are not members of the stream should not receive a message with the post when a post is posted to a ${this.type} stream`;
	}

	makeData (callback) {
		BoundAsync.series(this, [
			this.createTeamCreator,
			this.createStreamCreator,
			this.createPostCreator,
			this.createRepo,
			this.createStream
		], callback);
	}

	createTeamCreator (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.teamCreatorData = response;
				callback();
			}
		);
	}

	createStreamCreator (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.streamCreatorData = response;
				callback();
			}
		);
	}

	createPostCreator (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.postCreatorData = response;
				callback();
			}
		);
	}

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
				],
				withRandomEmails: 1,
				token: this.teamCreatorData.accessToken
			}
		);
	}

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
				],
				token: this.streamCreatorData.accessToken
			}
		);
	}

	setChannelName (callback) {
		this.channelName = 'team-' + this.team._id;
		callback();
	}

	generateMessage (callback) {
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
