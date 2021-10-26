// handle unit tests for the "PUT /no-auth/login" request

'use strict';

const LoginTest = require('./login_test');
const InitialDataTest = require('./initial_data_test');
const MeAttributesTest = require('./me_attributes_test');
const ExpiredTokenTest = require('./expired_token_test');
const TokenIsValidTest = require('./token_is_valid_test');
const SubscriptionTest = require('./subscription_test');
const SubscriptionToObjectByMentionTest = require('./subscription_to_object_by_mention_test');
const SubscriptionToObjectByCreationTest = require('./subscription_to_object_by_creation_test');
const SubscriptionToObjectByMentionOtherTeamTest = require('./subscription_to_object_by_mention_other_team_test');

class RawLoginRequestTester {

	rawLoginTest () {
		new LoginTest().test();
		new InitialDataTest().test();
		new MeAttributesTest().test();
		new ExpiredTokenTest().test();
		new TokenIsValidTest().test();
		new SubscriptionTest({ which: 'user' }).test();
		new SubscriptionTest({ which: 'team' }).test();
		//new SubscriptionTest({ which: 'stream' }).test(); // subscription to stream channels is deprecated
		//new SubscriptionToObjectByMentionTest().test();
		//new SubscriptionToObjectByCreationTest().test();
		//new SubscriptionToObjectByMentionOtherTeamTest().test();
	}
}

module.exports = RawLoginRequestTester;
