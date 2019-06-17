'use strict';

const RandomString = require('randomstring');
const LoginTest = require('./login_test');

class NoPasswordTest extends LoginTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 2;
		Object.assign(this.teamOptions, {
			creatorIndex: 1,
			numAdditionalInvites: 1
		});
	}

	get description () {
		return 'should return an error if a user with no password tries to login';
	}

	getExpectedError () {
		return {
			code: 'USRC-1001'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data = {
				email: this.users[2].user.email,
				password: RandomString.generate(8)
			};
			callback();
		});
	}
}

module.exports = NoPasswordTest;
