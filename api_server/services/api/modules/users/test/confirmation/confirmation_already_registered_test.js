'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Confirmation_Test = require('./confirmation_test');

class Confirmation_Already_Registered_Test extends Confirmation_Test {

	get_description () {
		return 'should return an error when confirming a registration with an email that has already been confirmed';
	}

	get_expected_fields () {
		return null;
	}

	get_expected_error () {
		return {
			code: 'USRC-1006'
		};
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.confirm
		], callback);
	}

	confirm (callback) {
		this.do_api_request({
			method: this.method,
			path: this.path,
			data: this.data
		}, callback);
	}
}

module.exports = Confirmation_Already_Registered_Test;
