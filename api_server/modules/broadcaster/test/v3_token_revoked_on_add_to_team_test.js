'use strict';

const CodeStreamMessageACLTest = require('./codestream_message_acl_test');

class V3TokenRevokedOnAddToTeamTest extends CodeStreamMessageACLTest {

	constructor (options) {
		super(options);
		this.useV3BroadcasterToken = true;
		this.listeningUserIndex = 1;
		this.dontObtainV3Token = true;
	}
	
	get description () {
		return 'should get an error when trying to subscribe to a user channel with a v3 token that has been revoked due to someone adding me to a team';
	}

	setChannelName (callback) {
		this.channelName = 'user-' + this.users[1].user.id;
		callback();
	}
}

module.exports = V3TokenRevokedOnAddToTeamTest;
