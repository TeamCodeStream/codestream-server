'use strict';

var Aggregation = require(process.env.CS_API_TOP + '/lib/util/aggregation');
var RegistrationRequestTester = require('./registration/registration_request_tester');
var ConfirmationRequestTester = require('./confirmation/confirmation_request_tester');
var LoginRequestTester = require('./login/login_request_tester');
var GetUserRequestTester = require('./get_user/get_user_request_tester');
var GetUsersRequestTester = require('./get_users/get_users_request_tester');
var ReadRequestTester = require('./read/read_request_tester');

class UserRequestTester extends Aggregation(
	RegistrationRequestTester,
	ConfirmationRequestTester,
	LoginRequestTester,
	GetUserRequestTester,
	GetUsersRequestTester,
	ReadRequestTester
) {
}

module.exports = UserRequestTester;
