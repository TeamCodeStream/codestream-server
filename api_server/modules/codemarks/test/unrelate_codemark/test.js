// handle unit tests for the "PUT /unrelate-codemarks/:id1/:id2" request to remove
// the relation between two codemarks

'use strict';

const UnrelateCodemarkTest = require('./unrelate_codemark_test');
const FetchTest = require('./fetch_test');
const UnrelateAlreadyRelatedCodemarkTest = require('./unrelate_already_related_codemark_test');
const FetchAlreadyRelatedCodemarkTest = require('./fetch_already_related_codemark_test');
const UnrelatePreviouslyUnrelatedCodemarkTest = require('./unrelate_previously_unrelated_codemark_test');
const MessageTest = require('./message_test');
const CodemarkNotFoundTest = require('./codemark_not_found_test');
const ACLTest = require('./acl_test');
const DifferentTeamTest = require('./different_team_test');

class UnrelateCodemarkRequestTester {

	test () {
		new UnrelateCodemarkTest().test();
		new FetchTest().test();
		new UnrelateAlreadyRelatedCodemarkTest().test();
		new FetchAlreadyRelatedCodemarkTest().test();
		new UnrelatePreviouslyUnrelatedCodemarkTest().test();
		new MessageTest().test();
		new CodemarkNotFoundTest({ whichCodemark: 0 }).test();
		new CodemarkNotFoundTest({ whichCodemark: 1 }).test();
		new ACLTest().test();
		new DifferentTeamTest().test();
	}
}

module.exports = new UnrelateCodemarkRequestTester();
