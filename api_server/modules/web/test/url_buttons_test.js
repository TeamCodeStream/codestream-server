'use strict';

const PrivatePermalinkTest = require('./private_permalink_test');
const Assert = require('assert');

class UrlButtonsTest extends PrivatePermalinkTest {

	get description () {
		return 'buttons to click to code provider and thread provider when displaying a permalink for which the codemark was submitted with the appropriate urls set';
	}

	createCodemarkForPermalink (callback) {
		this.data.remoteCodeUrl = {
			name: 'github',
			url: this.repoFactory.randomUrl()
		};
		this.data.threadUrl  = {
			name: 'slack',
			url: this.repoFactory.randomUrl()
		};
		super.createCodemarkForPermalink(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.notEqual(data.indexOf('Open Code on GitHub'), -1, 'did not get expected email in the html response');
		Assert.notEqual(data.indexOf('Open Thread on Slack'), -1, 'did not get expected provider in the html response');
		super.validateResponse(data);
	}
}

module.exports = UrlButtonsTest;
