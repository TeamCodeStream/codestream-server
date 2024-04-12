// master unit test runner for all modules

'use strict';

// make eslint happy
/* globals describe */

describe('modules', () => {
	require('./authenticator/test/test.js');
	require('./versioner/test/test.js');
	require('./analytics/test/test.js');
	require('./newrelic/test/test.js');
	require('./broadcaster/test/test.js');
	require('./users/test/test.js');
	require('./providers/test/test.js');
	require('./repos/test/test.js');
	require('./companies/test/test.js');
	require('./teams/test/test.js');
	require('./streams/test/test.js');
	require('./posts/test/test.js');
	require('./codemarks/test/test.js');
	require('./reviews/test/test.js');
	require('./code_errors/test/test.js');
	require('./markers/test/test.js');
	//require('./web/test/test.js');
	require('./inbound_emails/test/test.js');
	require('./marker_locations/test/test.js');
	require('./newrelic_comments/test/test.js');
	require('./environment_manager/test/test.js');
	require('./entities/test/test.js');
});
