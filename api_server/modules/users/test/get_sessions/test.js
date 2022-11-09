// handle unit tests for the "GET /sessions" request

'use strict';

const GetSessionsDeprecatedTest = require('./get_sessions_deprecated_test');
//const GetSessionsTest = require('./get_sessions_test');

class GetSessionsRequestTester {

	test () {
		new GetSessionsDeprecatedTest().test();
		//new GetSessionsTest().test();
	}
}

module.exports = new GetSessionsRequestTester();
