'use strict';

const ExistsButUnregisteredTest = require('./exists_but_unregistered_test');

class ExistsButUnregisteredInvitedTest extends ExistsButUnregisteredTest {

	constructor (options) {
		super(options);
		delete this.teamOptions.members;
		this.userOptions.numUnregistered = 0;
		this.teamOptions.numAdditionalInvites = 1;
	}

	get description () {
		return 'should be ok to register a user using NR API key if a user record exists matching the email, but the user is unregistered and already invited to a team';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.expectedCreatorId = this.users[0].user.id;
			callback();
		});
	}
}

module.exports = ExistsButUnregisteredInvitedTest;
