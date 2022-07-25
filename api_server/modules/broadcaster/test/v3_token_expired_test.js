'use strict';

const CodeStreamMessageACLTest = require('./codestream_message_acl_test');

class V3TokenExpiredTest extends CodeStreamMessageACLTest {

	constructor (options) {
		super(options);
		this.useV3BroadcasterToken = true;
		this.setV3TokenTTL = 1;
		this.userOptions.numRegistered = 1;
	}
	
	get description () {
		return 'should get an error when trying to subscribe to a user channel with a v3 token that has expired';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			setTimeout(callback, 61000);
		});
	}

	setChannelName (callback) {
		this.channelName = 'user-' + this.currentUser.user.id;
		callback();
	}
}

module.exports = V3TokenExpiredTest;
