'use strict';

const ServiceGatewayCSUserIdTest = require('./service_gateway_cs_userid_test');

class ServiceGatewayUserNotFoundTest extends ServiceGatewayCSUserIdTest {

	get description () {
		return 'should prevent access to resources when the user found in a Service Gateway header does not exist';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1004'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.apiRequestOptions.headers['Service-Gateway-CS-User-Id'] = 'xxx';
			callback();
		});
	}
}

module.exports = ServiceGatewayUserNotFoundTest;
