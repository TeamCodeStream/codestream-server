'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class ChangeEmailTest extends CodeStreamAPITest {

	get description () {
		return 'should succeed when a user initiates changing their email';
	}

	get method () {
		return 'put';
	}

	get path () {
		return '/change-email';
	}

	// before the test runs...
	before (callback) {
		// set the new email
		this.data = {
			email: this.userFactory.randomEmail()
		};
		callback();
	}
}

module.exports = ChangeEmailTest;
