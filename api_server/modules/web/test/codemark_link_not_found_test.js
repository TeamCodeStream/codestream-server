'use strict';

const PermalinkTest = require('./permalink_test');
const Assert = require('assert');
const UUID = require('uuid').v4;

class CodemarkLinkNotFoundTest extends PermalinkTest {

	constructor (options) {
		super(options);
		this.apiRequestOptions.expectRedirect = true;
		this.wantSignin = true;
	}

	get description () {
		return `when opening a ${this.permalinkType} permalink, and the link indicated in the permalink is not found, the user should be redirected to the 404 page`;
	}

	createPermalink (callback) {
		super.createPermalink(error => {
			if (error) { return callback(error); }
			const pathParts = this.path.split('/');
			pathParts[2] = this.encodeLinkId(UUID().replace(/-/g, ''));
			this.path = pathParts.join('/');
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert(data.match(/^\/web\/404/), 'did not get redirected to expected page');
	}
}

module.exports = CodemarkLinkNotFoundTest;
