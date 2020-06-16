'use strict';

const PermalinkTest = require('./permalink_test');

class PrivatePermalinkTest extends PermalinkTest {

	constructor (options) {
		super(options);
		this.permalinkType = 'private';
		this.wantSignin = true;
	}

	get description () {
		return 'user with appropriate credentials should be able to open a web page for a private permalink';
	}
}

module.exports = PrivatePermalinkTest;
