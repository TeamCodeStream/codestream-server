'use strict';

var CodeStreamMessageACLTest = require('./codestream_message_acl_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class StreamChannelACLTest extends CodeStreamMessageACLTest {

	get description () {
		return 'should get an error when trying to subscribe to a stream channel for a stream i am not a member of';
	}

	// make the data needed to prepare for the request that triggers the message
	makeData (callback) {
		BoundAsync.series(this, [
			this.createRepo,	// create a repo
			this.createStream	// create a stream in that repo, the other user will not be in this stream
		], callback);
	}

	// create a repo
	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.users = response.users;
				callback();
			},
			{
				withRandomEmails: 2,	// put a few pther users in it
				withEmails: [this.otherUserData.user.email],	// put the "other" user in it
				token: this.token	// i am the creator
			}
		);
	}

	// create a stream in the repo, without the "other" user
	createStream (callback) {
		let streamUsers = this.users.filter(user => user._id !== this.otherUserData.user._id);	// filter out the "other" user
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			{
				type: 'channel',
				teamId: this.team._id,
				memberIds: streamUsers.map(user => user._id),
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

module.exports = StreamChannelACLTest;
