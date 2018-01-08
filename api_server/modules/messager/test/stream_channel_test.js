'use strict';

var CodeStreamMessageTest = require('./codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class StreamChannelTest extends CodeStreamMessageTest {

	get description () {
		return 'should be able to subscribe to and receive a message from the stream channels for all my streams as a confirmed user';
	}

	// make the data needed to prepare for the request that triggers the message
	makeData (callback) {
		BoundAsync.series(this, [
			this.createRepo,	// create a repo
			this.createStream	// create a stream
		], callback);
	}

	// create a random repo
	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.users = response.users;
				callback();
			},
			{
				withRandomEmails: 2,	// add a few random users
				token: this.token		// i am the creator
			}
		);
	}

	// create a random channel stream, with everyone on the team
	createStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			{
				type: 'channel',
				teamId: this.team._id,
				memberIds: this.users.map(user => user._id),
				token: this.token
			}
		);
	}

	// set the channel name to listen on
	setChannelName (callback) {
		// listening on the stream channel for this stream
		this.channelName = 'stream-' + this.stream._id;
		callback();
	}
}

module.exports = StreamChannelTest;
