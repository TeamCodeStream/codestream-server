'use strict';

const ServiceGatewayNRUserIdTest = require('./service_gateway_nr_userid_test');

class ServiceGatewayNRUserIdUserNotFoundTest extends ServiceGatewayNRUserIdTest {

	get description () {
		return 'should return an error when the user found in a New Relic Service Gateway header does not exist';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1001'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.apiRequestOptions.headers['Service-Gateway-User-Id'] = 'xxx';
			callback();
		});
	}
}

module.exports = ServiceGatewayNRUserIdUserNotFoundTest;
