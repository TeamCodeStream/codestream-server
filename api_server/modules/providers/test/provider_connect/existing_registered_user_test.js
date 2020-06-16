'use strict';

const ExistingUnregisteredUserTest = require('./existing_unregistered_user_test');

class ExistingRegisteredUserTest extends ExistingUnregisteredUserTest {

	constructor (options) {
		super(options);
		this.preExistingUserIsRegistered = true;
	}

	get description () {
		return `should return a pre-existing registered user and create a team when the user connects to ${this.provider}`;
	}
}

module.exports = ExistingRegisteredUserTest;
