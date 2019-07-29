// handle unit tests for the "PUT /relate-codemarks/:id1/:id2" request to create a relation between two codemarks

'use strict';

const RelateCodemarkTest = require('./relate_codemark_test');
const FetchTest = require('./fetch_test');
const RelateAlreadyRelatedCodemarkTest = require('./relate_already_related_codemark_test');
const FetchAlreadyRelatedCodemarkTest = require('./fetch_already_related_codemark_test');
const RelatePreviouslyRelatedCodemarkTest = require('./relate_previously_related_codemark_test');
const MessageTest = require('./message_test');
const CodemarkNotFoundTest = require('./codemark_not_found_test');
const ACLTest = require('./acl_test');
const DifferentTeamTest = require('./different_team_test');

class RelateCodemarkRequestTester {

	test () {
		new RelateCodemarkTest().test();
		new FetchTest().test();
		new RelateAlreadyRelatedCodemarkTest().test();
		new FetchAlreadyRelatedCodemarkTest().test();
		new RelatePreviouslyRelatedCodemarkTest().test();
		new MessageTest().test();
		new CodemarkNotFoundTest({ whichCodemark: 0 }).test();
		new CodemarkNotFoundTest({ whichCodemark: 1 }).test();
		new ACLTest().test();
		new DifferentTeamTest().test();
	}
}

module.exports = new RelateCodemarkRequestTester();
