// handle unit tests for the web module

'use strict';

// make eslint happy
/* globals describe */

const SimpleWebRequestTester = require('./simple_web/test');
const PermalinksRequestTester = require('./permalinks/test');
const SetPasswordRequestTester = require('./set_password/test');

describe('web requests', function() {

	this.timeout(5000);

	describe('simple web', SimpleWebRequestTester.test);
	describe('permalinks', PermalinksRequestTester.test);
	describe('set password', SetPasswordRequestTester.test);
});
