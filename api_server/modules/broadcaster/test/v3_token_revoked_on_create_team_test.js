'use strict';

const CodeStreamMessageACLTest = require('./codestream_message_acl_test');

class V3TokenRevokedOnCreateTeamTest extends CodeStreamMessageACLTest {

	constructor (options) {
		super(options);
		this.useV3BroadcasterToken = true;
	}
	
	get description () {
		return 'should get an error when trying to subscribe to a user channel with a v3 token that has been revoked due to me creating a team';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.companyFactory.createRandomCompany(callback, { token: this.currentUser.accessToken });
		});
	}

	setChannelName (callback) {
		this.channelName = 'user-' + this.currentUser.user.id;
		callback();
	}
}

module.exports = V3TokenRevokedOnCreateTeamTest;
