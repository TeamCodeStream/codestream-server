// handle unit tests for the "PUT /no-auth/provider-refresh/newrelic" request,
// to handle obtaining an access token given a New Relic issued refresh token 
 
'use strict';

const NewRelicRefreshTest = require('./newrelic_refresh_test');
const RefreshTokenRequiredTest = require('./refresh_token_required_test');
const UserNotFoundTest = require('./user_not_found_test');
const UserDeactivatedTest = require('./user_deactivated_test');
const MessageTest = require('./message_test');
const FetchTest = require('./fetch_test');

class NewRelicRefreshTester {

	test () {
		new NewRelicRefreshTest().test();
		new NewRelicRefreshTest({ wantIDToken: true }).test();
		new RefreshTokenRequiredTest().test();
		new UserNotFoundTest().test();
		new UserDeactivatedTest().test();
		new MessageTest().test();
		new MessageTest({ wantIDToken: true }).test();
		new FetchTest().test();
		new FetchTest({ wantIDToken: true }).test();
	}
}

module.exports = new NewRelicRefreshTester();
