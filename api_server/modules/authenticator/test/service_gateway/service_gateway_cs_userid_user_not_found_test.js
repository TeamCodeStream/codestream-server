'use strict';

const ServiceGatewayCSUserIdTest = require('./service_gateway_cs_userid_test');

class ServiceGatewayCSUserIdUserNotFoundTest extends ServiceGatewayCSUserIdTest {

	get description () {
		return 'should return an error when the user found in a CodeStream Service Gateway header does not exist';
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

module.exports = ServiceGatewayCSUserIdUserNotFoundTest;
