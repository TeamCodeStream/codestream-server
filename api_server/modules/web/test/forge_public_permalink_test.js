'use strict';

const PermalinkTest = require('./permalink_test');
const Assert = require('assert');

class ForgePublicPermalinkTest extends PermalinkTest {

	constructor (options) {
		super(options);
		this.apiRequestOptions.expectRedirect = true;
		this.permalinkType = 'private';
	}

	get description () {
		return 'user should not be able to take a private permalink and manually turn it into a public permalink to access it';
	}

	createPermalink (callback) {
		super.createPermalink(error => {
			if (error) { return callback(error); }
			const pathParts = this.path.split('/');
			pathParts[1] = 'p';
			this.path = pathParts.join('/');
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert(data.match(/^\/web\/404/), 'did not get redirected to expected page');
	}
}

module.exports = ForgePublicPermalinkTest;
