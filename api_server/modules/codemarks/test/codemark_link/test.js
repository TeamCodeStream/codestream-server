// handle unit tests for the "POST /codemark/:id/permalink" request to create a permalink
// referencing an existing codemark

'use strict';

const CodemarkLinkTest = require('./codemark_link_test');
const WithMarkerTest = require('./with_marker_test');
const InvalidCodemarkIdTest = require('./invalid_codemark_id_test');
const ACLTest = require('./acl_test');
const DuplicateLinkTest = require('./duplicate_link_test');

class CodemarkLinkRequestTester {

	test () {
		new CodemarkLinkTest({ permalinkType: 'public' }).test();
		new CodemarkLinkTest({ permalinkType: 'private' }).test();
		new CodemarkLinkTest({ permalinkType: 'private', codemarkType: 'issue' }).test();
		new CodemarkLinkTest({ permalinkType: 'private', codemarkType: 'bookmark', wantMarkers: 1 }).test();
		new CodemarkLinkTest({ permalinkType: 'private', codemarkType: 'trap', wantMarkers: 1 }).test();
		new CodemarkLinkTest({ permalinkType: 'private', codemarkType: 'question' }).test();
		new WithMarkerTest({ permalinkType: 'public' }).test();
		new WithMarkerTest({ permalinkType: 'private' }).test();
		new InvalidCodemarkIdTest().test();
		new ACLTest().test();
		new DuplicateLinkTest({ permalinkType: 'public' }).test();
		new DuplicateLinkTest({ permalinkType: 'private' }).test();
		new DuplicateLinkTest({ wantMarkers: 1, permalinkType: 'public' }).test();
		new DuplicateLinkTest({ wantMarkers: 1, permalinkType: 'private' }).test();
	}
}

module.exports = new CodemarkLinkRequestTester();
