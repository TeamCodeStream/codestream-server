'use strict';

const CodeStreamMessageACLTest = require('./codestream_message_acl_test');

class TeamChannelACLTest extends CodeStreamMessageACLTest {

	constructor (options) {
		super(options);
		Object.assign(this.teamOptions, {
			members: [1],
			creatorIndex: 1,
			inviterIndex: 1
		});
		delete this.streamOptions.creatorIndex;
	}

	get description () {
		return 'should get an error when trying to subscribe to a team channel for a team i am not a member of';
	}

	// set the channel name to listen on
	setChannelName (callback) {
		// we'll subscribe to the channel for the created team, but since the pubnub channel
		// is for the "other" user, they won't be able to subscribe
		this.channelName = 'team-' + this.team._id;
		callback();
	}
}

module.exports = TeamChannelACLTest;
