'use strict';

var Aggregation = require(process.env.CS_API_TOP + '/lib/util/aggregation');
var Registration_Request_Tester = require('./registration/registration_request_tester');
var Confirmation_Request_Tester = require('./confirmation/confirmation_request_tester');
var Login_Request_Tester = require('./login/login_request_tester');
var Get_User_Request_Tester = require('./get_user/get_user_request_tester');
var Get_Users_Request_Tester = require('./get_users/get_users_request_tester');
var Read_Request_Tester = require('./read/read_request_tester');

class User_Request_Tester extends Aggregation(
	Registration_Request_Tester,
	Confirmation_Request_Tester,
	Login_Request_Tester,
	Get_User_Request_Tester,
	Get_Users_Request_Tester,
	Read_Request_Tester
) {
}

module.exports = User_Request_Tester;
