// handle unit tests for the MS Teams integration module

'use strict';

// make eslint happy
/* globals describe */

const TeamsEnableRequestTester = require('./teams_enable/test.js');
const TeamsOutTester = require('./teams_out/test.js');
const TeamsPostRequestTester = require('./teams_post/test.js');

describe('teams integration requests', function() {

	this.timeout(20000);

	describe('PUT /teams-enable', TeamsEnableRequestTester.test);
	describe('teams out', TeamsOutTester.test);
	describe('POST /teams-post', TeamsPostRequestTester.test);
});
