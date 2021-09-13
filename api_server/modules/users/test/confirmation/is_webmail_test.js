'use strict';

const ConfirmationTest = require('./confirmation_test');

class IsWebmailTest extends ConfirmationTest {

	get description () {
		return 'response to email confirmation should include flag indicating email is a webmail address';
	}

	getUserData () {
		this.isWebmail = true;
		return this.userFactory.getRandomUserData({ wantWebmail: true });
	}
}

module.exports = IsWebmailTest;
