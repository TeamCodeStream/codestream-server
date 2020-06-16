// perform any tests of these utility libraries

'use strict';

// make eslint happy
/* globals describe */

describe('server utils', () => {
	require('./pubnub/test/test.js');
	require('./mongo/test/test.js');
});
