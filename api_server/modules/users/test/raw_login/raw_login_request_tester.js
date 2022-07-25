// handle unit tests for the "PUT /no-auth/login" request

'use strict';

const LoginTest = require('./login_test');
const InitialDataTest = require('./initial_data_test');
const MeAttributesTest = require('./me_attributes_test');
const ExpiredTokenTest = require('./expired_token_test');
const TokenIsValidTest = require('./token_is_valid_test');
const RawLoginSubscriptionTest = require('./raw_login_subscription_test');

class RawLoginRequestTester {

	rawLoginTest () {
		new LoginTest().test();
		new InitialDataTest().test();
		new MeAttributesTest().test();
		new ExpiredTokenTest().test();
		new TokenIsValidTest().test();
		new RawLoginSubscriptionTest().test();
		new RawLoginSubscriptionTest({ which: 'team' }).test();
		new RawLoginSubscriptionTest({ useV3BroadcasterToken: true }).test();
		new RawLoginSubscriptionTest({ useV3BroadcasterToken: true, which: 'team' }).test();
		//new SubscriptionTest({ which: 'stream' }).test(); // subscription to stream channels is deprecated
	}
}

module.exports = RawLoginRequestTester;
