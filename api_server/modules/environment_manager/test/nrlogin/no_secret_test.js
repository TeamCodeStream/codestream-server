'use strict';

const NRLoginTest = require('./nrlogin_test');

class NoSecretTest extends NRLoginTest {

	constructor (options) {
		super(options);
		this.wantError = true;
	}
	
	get description () {
		return 'should return an error when making a cross-environment New Relic auth request but not providing the auth secret';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1001'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.apiRequestOptions.headers['X-CS-Auth-Secret'];
			callback();
		});
	}
}

module.exports = NoSecretTest;
