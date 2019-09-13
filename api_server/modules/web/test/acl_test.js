'use strict';

const PrivatePermalinkTest = require('./private_permalink_test');
const Assert = require('assert');

class ACLTest extends PrivatePermalinkTest {

	constructor (options) {
		super(options);
		this.teamOptions.members = [];
		this.apiRequestOptions.expectRedirect = true;
	}

	get description () {
		return 'when opening a private permalink, if the user is not on the team that owns the permalink, the user should be redirected to the 404 page';
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert(data.match(/^\/web\/404/), 'did not get redirected to expected page');
	}
}

module.exports = ACLTest;
