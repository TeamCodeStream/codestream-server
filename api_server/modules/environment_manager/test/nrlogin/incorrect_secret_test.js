'use strict';

const NRLoginTest = require('./nrlogin_test');

class IncorrectSecretTest extends NRLoginTest {

	constructor (options) {
		super(options);
		this.wantError = true;
	}
	
	get description () {
		return 'should return an error when making a cross-environment New Relic auth request but providing the incorrect auth secret';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1001'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.apiRequestOptions.headers['X-CS-Auth-Secret'] = 'xxxxxxxxxxx';
			callback();
		});
	}
}

module.exports = IncorrectSecretTest;
