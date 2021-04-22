// handle unit tests for the "DELETE /codemarks/:d" request to delete a knowledge base codemark

'use strict';

const DeleteCodemarkTest = require('./delete_codemark_test');
const DeleteCodemarkFetchTest = require('./delete_codemark_fetch_test');
const DeleteMarkerTest = require('./delete_marker_test');
const DeleteMarkerFetchTest = require('./delete_marker_fetch_test');
const ACLTest = require('./acl_test');
const ACLTeamTest = require('./acl_team_test');
const CodemarkNotFoundTest = require('./codemark_not_found_test');
const AlreadyDeletedTest = require('./already_deleted_test');
const AdminCanDeleteTest = require('./admin_can_delete_test');
const MessageTest = require('./message_test');
const MarkerToTeamMessageTest = require('./marker_to_team_message_test');
const DeleteRelationsTest = require('./delete_relations_test');
const DeleteRelationsMessageTest = require('./delete_relations_message_test');
const NoDeletePostlessCodemarkTest = require('./no_delete_postless_codemark_test');

class DeleteCodemarkRequestTester {

	test () {
		new DeleteCodemarkTest().test();
		new DeleteCodemarkFetchTest().test();
		new DeleteMarkerTest().test();
		new DeleteMarkerFetchTest().test();
		new ACLTest().test();
		new ACLTeamTest().test();
		new CodemarkNotFoundTest().test();
		new AlreadyDeletedTest().test();
		new AdminCanDeleteTest().test();
		new MessageTest().test();
		// NOTE posting to streams other than the team stream is no longer allowed
		//new MessageTest({ streamType: 'channel' }).test();
		//new MessageTest({ streamType: 'direct' }).test();
		//new MessageTest({ streamType: 'team stream' }).test();
		new MarkerToTeamMessageTest().test();
		// NOTE posting to streams other than the team stream is no longer allowed
		//new MarkerToTeamMessageTest({ streamType: 'channel' }).test();
		//new MarkerToTeamMessageTest({ streamType: 'direct' }).test();
		//new MarkerToTeamMessageTest({ streamType: 'team stream' }).test();
		new DeleteRelationsTest().test();
		new DeleteRelationsMessageTest().test();
		// NOTE posting to streams other than the team stream is no longer allowed
		//new DeleteRelationsMessageTest({ streamType: 'channel' }).test();
		//new DeleteRelationsMessageTest({ streamType: 'direct' }).test();
		//new DeleteRelationsMessageTest({ streamType: 'team stream' }).test();
		new NoDeletePostlessCodemarkTest().test();
	}
}

module.exports = new DeleteCodemarkRequestTester();
