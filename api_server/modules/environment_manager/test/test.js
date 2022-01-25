// handle unit tests for the environment manager module

'use strict';

// make eslint happy
/* globals describe */

const FetchUserTester = require('./fetch_user/test');
const ConfirmUserTester = require('./confirm_user/test');

describe('environment manager requests', function() {

	this.timeout(10000);

	describe('GET /xenv/fetch-user', FetchUserTester.test);
	describe('POST /xenv/confirm-user', ConfirmUserTester.test);
});
