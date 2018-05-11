'use strict';

var LoginTest = require('./login_test');

class NoLoginUnregisteredTest extends LoginTest {

    constructor (options) {
        super(options);
        this.noConfirm = true;
    }

	get description () {
		return 'should return an error if an unconfirmed user tries to login';
	}

	getExpectedError () {
		return {
			code: 'USRC-1010'
		};
	}
}

module.exports = NoLoginUnregisteredTest;
