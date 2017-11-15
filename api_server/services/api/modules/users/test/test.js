'use strict';

// make jshint happy
/* globals describe */

var User_Request_Tester = require('./user_request_tester');

var user_request_tester = new User_Request_Tester();

describe('user requests', function() {

	this.timeout(10000);

	describe('POST /no-auth/register', user_request_tester.registration_test);
	describe('POST /no-auth/confirm', user_request_tester.confirmation_test);
	describe('PUT /login', user_request_tester.login_test);
	describe('GET /users/:id', user_request_tester.get_user_test);
	describe('GET /users', user_request_tester.get_users_test);
	describe('PUT /read/:stream_id', user_request_tester.read_test);

});
