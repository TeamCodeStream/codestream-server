'use strict';

var PostRepoTest = require('./post_repo_test');

class WebmailCompanyNameTest extends PostRepoTest {

	constructor (options) {
		super(options);
		this.userOptions = { wantWebmail: true };
	}

	get description () {
		return `company name should be full email address of creator when the creator has a webmail address`;
	}
}

module.exports = WebmailCompanyNameTest;
