'use strict';

const RegistrationTest = require('./registration_test');
const ParameterRequiredTest = require('../../../../lib/tester/parameter_required_test');

module.exports = parameter => {
	return {
		...RegistrationTest,
		...ParameterRequiredTest,
		description: 'should return an error when registering with no {{{ parameter }}}',
		parameter
	};
};
