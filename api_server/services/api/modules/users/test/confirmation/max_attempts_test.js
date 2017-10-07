'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Confirmation_Test = require('./confirmation_test');
var Confirm_Code = require('../../confirm_code');

class Max_Attempts_Test extends Confirmation_Test {

	get_description () {
		return 'should return an error when an incorrect confirmation code is used during confirmation and the maximum number of attempts has been reached';
	}

	get_expected_fields () {
		return null;
	}

	get_expected_error () {
		return {
			code: 'USRC-1004'
		};
	}

	make_bad_confirm_code () {
		let new_confirm_code;
		do {
			new_confirm_code = Confirm_Code();
		} while (new_confirm_code === this.data.confirmation_code);
		this.data.confirmation_code = new_confirm_code;
	}

	attempt_confirm (n, callback) {
		this.make_bad_confirm_code();
		this.do_api_request({
			method: this.method,
			path: this.path,
			data: this.data
		}, () => {
			callback();
		});
	}

	before (callback) {
		super.before(() => {
			Bound_Async.timesSeries(
				this,
				3,
				this.attempt_confirm,
				callback
			);
		});
	}
}

module.exports = Max_Attempts_Test;
