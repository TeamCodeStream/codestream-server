'use strict';

const TestSuite = require('../../../lib/tester/test_suite');

module.exports = new TestSuite({
	description: 'authentication',
	tests: [
		require('./authentication_test'),
		require('./missing_authorization_test'),
		require('./invalid_token_test'),
		require('./no_user_id_test'),
		require('./user_not_found_test'),
		require('./min_issuance_test')
	]
});
