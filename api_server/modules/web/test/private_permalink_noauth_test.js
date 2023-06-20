'use strict';

const PermalinkTest = require('./permalink_test');

class PrivatePermalinkNoAuthTest extends PermalinkTest {

	constructor (options) {
		super(options);
		this.permalinkType = 'private';
	}

	get description () {
		return 'when opening a private permalink, if there are no credentials, redirect should still work';
	}
}

module.exports = PrivatePermalinkNoAuthTest;
