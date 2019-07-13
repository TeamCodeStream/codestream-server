// unit tests associated with serving simple web pages for the web module

'use strict';

const SimpleWebTest = require('./simple_web_test');

const SIMPLE_TESTS = [
	{
		route: '/web/404',
		text: 'Sorry, we couldn\'t find what you were looking for.'
	},
	{
		route: '/web/finish',
		text: 'Return to your IDE to start using CodeStream.'
	},
	{
		route: '/web/user/password/reset/invalid',
		text: 'Return to your IDE and click on "Forgot password?" to request a new one.'
	},
	{
		route: '/web/user/password/updated',
		text: 'Return to your IDE to sign into CodeStream.'
	}
];

class SimpleWebRequestTester {

	test () {
		SIMPLE_TESTS.forEach(test => {
			new SimpleWebTest(test).test();
		});
	}
}

module.exports = new SimpleWebRequestTester();
