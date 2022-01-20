'use strict';

const RegistrationTest = require('./registration_test');
const InvalidParameterTest = require('../../../../lib/tester/invalid_parameter_test');

module.exports = (parameter, setType, shouldBeType) => {
	return {
		...RegistrationTest,
		...InvalidParameterTest,
		description: 'should return an error when registering with the {{{ parameter }}} parameter set to a type of {{{ setType }}}',
		parameter,
		setType,
		shouldBeType
	};
};
