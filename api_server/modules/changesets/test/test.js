// handle unit tests for the changesets module

'use strict';

// make eslint happy
/* globals describe */

const GetChangesetRequestTester = require('./get_changeset/test');
const GetChangesetsRequestTester = require('./get_changesets/test');

describe('changeset requests', function() {

	this.timeout(20000);

	describe('GET /changesets/:id', GetChangesetRequestTester.test);
	describe('GET /changesets', GetChangesetsRequestTester.test);
});
