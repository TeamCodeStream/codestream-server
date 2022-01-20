'use strict';

const TestSuite = require('../../../../lib/tester/test_suite');

module.exports = new TestSuite({
	description: 'registration',
	tests: [
		require('./registration_test'),
		require('./parameter_required_test')('email'),
		require('./parameter_required_test')('username'),
		require('./parameter_required_test')('password'),
		require('./invalid_parameter_test')('email', 'number', 'string'),
		require('./invalid_parameter_test')('username', 'number', 'string'),
		require('./invalid_parameter_test')('password', 'number', 'string')
	]
});
