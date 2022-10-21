'use strict';

const GetSessionsTest = require('./get_sessions_test');

class GetSessionsDeprecatedTest extends GetSessionsTest {

	get description () {
		return `should return error when attempting to get user sessions, support is deprecated`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1016'
		};
	}
}

module.exports = GetSessionsDeprecatedTest;
