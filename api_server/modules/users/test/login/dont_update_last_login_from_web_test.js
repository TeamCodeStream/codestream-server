'use strict';

const LoginTest = require('./login_test');
const Assert = require('assert');

class DontUpdateLastLoginFromWebTest extends LoginTest {

	constructor (options) {
		super(options);
		this.dontCheckFirstSession = true;
	}

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
		Assert(data.user.lastOrigin !== 'webclient', 'lastOrigin was set to webclient');
		Assert(data.user.firstSessionStartedAt === undefined, 'firstSessionStartedAt was set');
		data.user.lastLogin = this.beforeLogin + 1;	// appease the rest of the validation
		this.expectedOrigin = undefined;
		super.validateResponse(data);
	}
}

module.exports = DontUpdateLastLoginFromWebTest;
