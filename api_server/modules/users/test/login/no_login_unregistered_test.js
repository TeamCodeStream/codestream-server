'use strict';

const LoginTest = require('./login_test');
const RandomString = require('randomstring');

class NoLoginUnregisteredTest extends LoginTest {

	constructor (options) {
		super(options);
		this.userOptions.numUnregistered = 1;
		this.userOptions.userData = [{}, { password: RandomString.generate(10) }];
	}

	get description () {
		return 'should return an error if an unconfirmed user tries to login';
	}

	getExpectedError () {
		return {
			code: 'USRC-1010'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data = {
				email: this.users[1].user.email,
				password: this.userOptions.userData[1].password
			};
			callback();
		});
	}
}

module.exports = NoLoginUnregisteredTest;
