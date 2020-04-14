// handle unit tests for the users module

'use strict';

// make eslint happy
/* globals describe */

const UserRequestTester = require('./user_request_tester');
/*
const GetSessionsRequestTester = require('./get_sessions/test');
const PresenceRequestTester = require('./presence/test');
const ChangePasswordRequestTester = require('./change_password/test');
const ForgotPasswordRequestTester = require('./forgot_password/test');
const CheckResetRequestTester = require('./check_reset/test');
const ResendConfirmRequestTester = require('./resend_confirm/test');
const CheckSignupRequestTester = require('./check_signup/test');
const ChangeEmailRequestTester = require('./change_email/test');
const BumpPostsRequestTester = require('./bump_posts/test');
const InviteInfoRequestTester = require('./invite_info/test');
const DeleteUserRequestTester = require('./delete_user/test');
*/

const userRequestTester = new UserRequestTester();

describe('user requests', function() {

	this.timeout(20000);

	/*
	describe('POST /no-auth/register', userRequestTester.registrationTest);
	describe('POST /no-auth/confirm', userRequestTester.confirmationTest);
	*/
	describe('PUT /no-auth/login', userRequestTester.loginTest);
	/*
	describe('PUT /login', userRequestTester.rawLoginTest);
	describe('GET /users/:id', userRequestTester.getUserTest);
	describe('GET /users', userRequestTester.getUsersTest);
	describe('PUT /read/:streamId', userRequestTester.readTest);
	describe('PUT /unread/:postId', userRequestTester.unreadTest);
	describe('GET /preferences', userRequestTester.getPreferencesTest);
	describe('PUT /preferences', userRequestTester.putPreferencesTest);
	describe('PUT /users/:id', userRequestTester.putUserTest);
	describe('POST /users', userRequestTester.postUserTest);
	describe('PUT /grant/:channel', userRequestTester.grantTest);
	describe('GET /sessions', GetSessionsRequestTester.test);
	describe('PUT /presence', PresenceRequestTester.test);
	describe('PUT /password', ChangePasswordRequestTester.test);
	describe('PUT /no-auth/forgot-password', ForgotPasswordRequestTester.test);
	describe('GET /no-auth/check-reset', CheckResetRequestTester.test);
	describe('PUT /no-auth/resend-confirm', ResendConfirmRequestTester.test);
	describe('PUT /no-auth/check-signup', CheckSignupRequestTester.test);
	describe('PUT /change-email', ChangeEmailRequestTester.test);
	describe('PUT /bump-posts', BumpPostsRequestTester.test);
	describe('GET /no-auth/invite-info', InviteInfoRequestTester.test);
	describe('DELETE /users/:id', DeleteUserRequestTester.test);
	*/
});
