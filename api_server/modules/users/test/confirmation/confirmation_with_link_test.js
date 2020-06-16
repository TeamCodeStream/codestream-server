'use strict';

const ConfirmationTest = require('./confirmation_test');

class ConfirmationWithLinkTest extends ConfirmationTest {

	constructor (options) {
		super(options);
		this.userOptions.wantLink = true;
	}

	get description () {
		return 'should return valid user data and an access token when confirming a registration using a confirmation link';
	}
}

module.exports = ConfirmationWithLinkTest;
