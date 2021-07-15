'use strict';

const UnfollowTest = require('./unfollow_test');
const Assert = require('assert');

class ACLTeamTest extends UnfollowTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 3;
		this.teamOptions.members = [2];
		this.skipFollow = true;
	}

	get description () {
		return 'should redirect to an error page when trying to unfollow a code error via email link on a team the current user is not a member of';
	}

	validateResponse (data) {
		Assert.equal(data, '/web/unfollow-code-error-error?error=RAPI-1010', 'improper redirect');
	}
}

module.exports = ACLTeamTest;
