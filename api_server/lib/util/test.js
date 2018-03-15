// perform any tests of these utility libraries

'use strict';

// make eslint happy
/* globals describe */

describe ('utils', () => {
	require('./mongo/test/test.js');
	require('./data_collection/test/test.js');
	require('./git_repo/test/test.js');
});
