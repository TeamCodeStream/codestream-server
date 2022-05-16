'use strict';

const ServiceGatewayNRUserIdTest = require('./service_gateway_nr_userid_test');

class ServiceGatewayNRUserIdFailsIfDisabledTest extends ServiceGatewayNRUserIdTest {

	get description () {
		return 'should not accept Service Gateway header identifying New Relic user if acceptance of Service Gateway headers is disabled';
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

module.exports = ServiceGatewayNRUserIdFailsIfDisabledTest;
