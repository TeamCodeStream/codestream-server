'use strict';

// make jshint happy
/* globals describe */

var UserRequestTester = require('./user_request_tester');

var userRequestTester = new UserRequestTester();

describe('user requests', function() {

	this.timeout(20000);

	describe('POST /no-auth/register', userRequestTester.registrationTest);
	describe('POST /no-auth/confirm', userRequestTester.confirmationTest);
	describe('PUT /login', userRequestTester.loginTest);
	describe('GET /users/:id', userRequestTester.getUserTest);
	describe('GET /users', userRequestTester.getUsersTest);
	describe('PUT /read/:streamId', userRequestTester.readTest);
	describe('GET /preferences', userRequestTester.getPreferencesTest);
	describe('PUT /preferences', userRequestTester.putPreferencesTest);
});
