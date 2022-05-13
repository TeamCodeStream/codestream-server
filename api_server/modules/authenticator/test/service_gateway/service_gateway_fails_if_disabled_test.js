'use strict';

const ServiceGatewayCSUserIdTest = require('./service_gateway_cs_userid_test');

class ServiceGatewayFailsIfDisabledTest extends ServiceGatewayCSUserIdTest {

	get description () {
		return 'should not accept Service Gateway header identifying CodeStream user if acceptance of Service Gateway headers is disabled';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1001'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			// the "super" test enabled, but we'll go back to disabled
			this.doApiRequest(
				{
					method: 'post',
					path: '/no-auth/enable-sg',
					data: {
						enable: false,
						_subscriptionCheat: this.apiConfig.sharedSecrets.subscriptionCheat
					}
				},
				callback
			);
		});
	}
}

module.exports = ServiceGatewayFailsIfDisabledTest;
