// handle unit tests for the environment manager module

'use strict';

// make eslint happy
/* globals describe */

const FetchUserTester = require('./fetch_user/test');
const ConfirmUserTester = require('./confirm_user/test');
const EligibleJoinCompaniesTester = require('./eligible_join_companies/test');
const UserCompaniesTester = require('./user_companies/test');
const ChangeEmailTester = require('./change_email/test');
const DeleteUserTester = require('./delete_user/test');
const EnsureUserTester = require('./ensure_user/test');
const PublishEligibleJoinCompaniesTester = require('./publish_eligible_join_companies/test');

describe('environment manager requests', function() {

	this.timeout(10000);

	describe('GET /xenv/fetch-user', FetchUserTester.test);
	describe('POST /xenv/confirm-user', ConfirmUserTester.test);
	describe('GET /xenv/eligible-join-companies', EligibleJoinCompaniesTester.test);
	describe('GET /xenv/user-companies', UserCompaniesTester.test);
	describe('PUT /xenv/change-email', ChangeEmailTester.test);
	describe('DELETE /xenv/delete-user/:id', DeleteUserTester.test);
	describe('POST /xenv/ensure-user', EnsureUserTester.test);
	describe('POST /xenv/publish-ejc', PublishEligibleJoinCompaniesTester.test);
});
