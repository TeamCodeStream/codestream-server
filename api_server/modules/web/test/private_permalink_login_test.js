'use strict';

const PermalinkTest = require('./permalink_test');
const Assert = require('assert');

class PrivatePermalinkLoginTest extends PermalinkTest {

	constructor (options) {
		super(options);
		this.permalinkType = 'private';
		this.apiRequestOptions.expectRedirect = true;
	}

	get description () {
		return 'when opening a private permalink, if there are no credentials, user should be redirected to the login page';
	}

	// validate the response to the test request
	validateResponse (data) {
		const encodedUrl = encodeURIComponent(this.path);
		const expectedUrl = `/web/login?url=${encodedUrl}&teamId=${this.team.id}`;
		Assert.equal(data, expectedUrl, 'did not get redirected to expected page');
	}
}

module.exports = PrivatePermalinkLoginTest;
