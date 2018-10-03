'use strict';

const LoginTest = require('./login_test');
const Assert = require('assert');

class DontUpdateLastLoginFromWebTest extends LoginTest {

	get description () {
		return 'when logging in from the web app, lastLogin should NOT be updated';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.apiRequestOptions = {
				headers: {
					'X-CS-Plugin-IDE': 'webclient'
				}
			};
			this.beforeLogin = Date.now();
			callback();
		});
	}

	validateResponse (data) {
		Assert(!data.user.lastLogin < this.beforeLogin, 'lastLogin was set by request');
		data.user.lastLogin = this.beforeLogin + 1;	// appease the rest of the validation
		super.validateResponse(data);
	}
}

module.exports = DontUpdateLastLoginFromWebTest;
