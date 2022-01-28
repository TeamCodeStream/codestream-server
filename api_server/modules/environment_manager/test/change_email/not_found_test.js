'use strict';

const ChangeEmailTest = require('./change_email_test');

class NotFoundTest extends ChangeEmailTest {

	get description () {
		return 'should return an empty result when trying to change a user\'s email across environment but that user that doesn\'t exist in the environment, nothing happens';
	}

	// before the test runs...
	before (callback) {
		// we'll try to changing a user with a random (non-existent) email
		super.before(error => {
			if (error) { return callback(error); }
			this.data.email = this.userFactory.randomEmail();
			callback();
		});
	}
}

module.exports = NotFoundTest;
