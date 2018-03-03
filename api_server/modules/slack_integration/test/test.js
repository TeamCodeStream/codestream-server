// handle unit tests for the slack integration module

'use strict';

// make jshint happy
/* globals describe */

const SlackEnableRequestTester = require('./slack_enable/test.js');
const SlackOutTester = require('./slack_out/test.js');

//const SlackPostRequestTester = require('./slack_post/test.js');

describe('slack integration requests', function() {

	this.timeout(10000);

	describe('PUT /slack-enable', SlackEnableRequestTester.test);
	describe('slack out', SlackOutTester.test);
//	describe('POST /slack-post', SlackPostRequestTester.test);
});
