'use strict';

const PermalinkTest = require('./permalink_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class ForgeAlreadyPublicPermalinkTest extends PermalinkTest {

	constructor (options) {
		super(options);
		this.apiRequestOptions.expectRedirect = true;
	}

	get description () {
		return 'user should not be able to take a private permalink and manually turn it into a public permalinkto access it, even if there is already a public permalink for a similar codemark';
	}

	// create the permalink
	createPermalink (callback) {
		// when we create the permalink, create it as a public permalink first ... this sets the 
		// hasPublicPermalink flag ... then create a private permalink otherwise using the same 
		// codemark data ... because this is private, it should not match an existing codemark link
		BoundAsync.series(this, [
			super.createPermalink,
			this.createPrivatePermalink
		], callback);
	}

	// create a private version of the public permalink we created
	createPrivatePermalink (callback) {
		this.codemarkData.createPermalink = 'private';
		this.createCodemarkForPermalink(error => {
			// now forge it as a public permalink, this still shouldn't work
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

module.exports = ForgeAlreadyPublicPermalinkTest;
