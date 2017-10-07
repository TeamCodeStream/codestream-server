'use strict';

var Confirmation_Test = require('./confirmation_test');

class Expiration_Test extends Confirmation_Test {

	get_description () {
		return 'should return an error when a confirmation code is expired';
	}

	get_expected_fields () {
		return null;
	}

	get_expected_error () {
		return {
			code: 'USRC-1003'
		};
	}

	before (callback) {
		this.user_options = {
			timeout: 100
		};
		super.before(() => {
			setTimeout(callback, 100);
		});
	}
}

module.exports = Expiration_Test;
