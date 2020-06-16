'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class ChangeEmailTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 1;
		delete this.teamOptions.creatorIndex;
	}

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
		super.before(error => {
			if (error) { return callback(error); }
			// set the new email
			this.data = {
				email: this.userFactory.randomEmail()
			};
			callback();
		});
	}
}

module.exports = ChangeEmailTest;
