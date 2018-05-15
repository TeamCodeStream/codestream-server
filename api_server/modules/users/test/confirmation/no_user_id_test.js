'use strict';

var ConfirmationTest = require('./confirmation_test');

class NoUserIdTest extends ConfirmationTest {

	get description () {
		return 'should return valid user data and an access token when confirming a registration, even if no userId is provided';
	}

	// before the test runs...
	before (callback) {
        // delete the userId from the test request, should still match by email
		super.before(error => {
            if (error) { return callback(error); }
            this.userId = this.data.userId;
            delete this.data.userId;
			callback();
		});
	}
}

module.exports = NoUserIdTest;
