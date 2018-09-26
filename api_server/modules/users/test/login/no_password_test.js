'use strict';

const RandomString = require('randomstring');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const LoginTest = require('./login_test');

class NoPasswordTest extends LoginTest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
		this.teamOptions.inviterIndex = 1;
		this.teamOptions.numAdditionalInvites = 2;
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
		CodeStreamAPITest.prototype.before.call(this, error => {
			if (error) { return callback(error); }
			this.data = {
				email: this.users[3].user.email,
				password: RandomString.generate(8)
			};
			callback();
		});
	}
}

module.exports = NoPasswordTest;
