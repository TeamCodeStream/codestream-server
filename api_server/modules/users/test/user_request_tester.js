// handle unit tests for the users module

'use strict';

var Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
var RegistrationRequestTester = require('./registration/registration_request_tester');
var ConfirmationRequestTester = require('./confirmation/confirmation_request_tester');
var LoginRequestTester = require('./login/login_request_tester');
var RawLoginRequestTester = require('./raw_login/raw_login_request_tester');
var GetUserRequestTester = require('./get_user/get_user_request_tester');
var GetUsersRequestTester = require('./get_users/get_users_request_tester');
var ReadRequestTester = require('./read/read_request_tester');
var UnreadRequestTester = require('./unread/unread_request_tester');
var PutPreferencesRequestTester = require('./put_preferences/put_preferences_request_tester');
var GetPreferencesRequestTester = require('./get_preferences/get_preferences_request_tester');
var PutUserRequestTester = require('./put_user/put_user_request_tester');
var PostUserRequestTester = require('./post_user/post_user_request_tester');
var GrantRequestTester = require('./grant/grant_request_tester');

class UserRequestTester extends Aggregation(
	RegistrationRequestTester,
	ConfirmationRequestTester,
	LoginRequestTester,
	RawLoginRequestTester,
	GetUserRequestTester,
	GetUsersRequestTester,
	ReadRequestTester,
	UnreadRequestTester,
	PutPreferencesRequestTester,
	GetPreferencesRequestTester,
	PutUserRequestTester,
	PostUserRequestTester,
	GrantRequestTester
) {
}

module.exports = UserRequestTester;
