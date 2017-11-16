'use strict';

var CodeStreamMessage_ACLTest = require('./codestream_message_acl_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class StreamChannelTeam_ACLTest extends CodeStreamMessage_ACLTest {

	get description () {
		return 'should get an error when trying to subscribe to a stream channel for a team i am not a member of';
	}

	makeData (callback) {
		BoundAsync.series(this, [
			this.createRepo,
			this.createStream
		], callback);
	}

	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.users = response.users;
				callback();
			},
			{
				withRandomEmails: 2,
				token: this.token
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
				type: 'channel',
				teamId: this.team._id,
				memberIds: this.users.map(user => user._id),
				token: this.token
			}
		);
	}

	setChannelName (callback) {
		this.channelName = 'stream-' + this.stream._id;
		callback();
	}
}

module.exports = StreamChannelTeam_ACLTest;
