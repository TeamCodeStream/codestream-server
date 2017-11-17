'use strict';

var GetStreamsByTeamIdAndIdsTest = require('./get_streams_by_team_id_and_ids_test');
var GetStreamsByRepoIdAndIdsTest = require('./get_streams_by_repo_id_and_ids_test');
var GetStreamsOnlyFromTeamTest = require('./get_streams_only_from_team_test');
var GetStreamsOnlyFromRepoTest = require('./get_streams_only_from_repo_test');
var GetFileStreamsByRepoTest = require('./get_file_streams_by_repo_test');
var GetChannelStreamsByTeamTest = require('./get_channel_streams_by_team_test');
var GetDirectStreamsByTeamTest = require('./get_direct_streams_by_team_test');
var GetAllStreamsByTeamTest = require('./get_all_streams_by_team_test');
var GetAllStreamsByRepoTest = require('./get_all_streams_by_repo_test');
var InvalidTypeTest = require('./invalid_type_test');
var NoRepo_IDTest = require('./no_repo_id_test');
var TeamIDRequiredTest = require('./team_id_required_test');
var GetUnreadStreamsTest = require('./get_unread_streams_test');
var GetNoUnreadStreamsTest = require('./get_no_unread_streams_test');
var ACLTest = require('./acl_test');

class GetStreamsRequestTester {

	getStreamsTest () {
		new GetStreamsByTeamIdAndIdsTest().test();
		new GetStreamsByRepoIdAndIdsTest().test();
		new GetStreamsOnlyFromTeamTest().test();
		new GetStreamsOnlyFromRepoTest().test();
		new GetFileStreamsByRepoTest().test();
		new GetChannelStreamsByTeamTest().test();
		new GetDirectStreamsByTeamTest().test();
		new GetAllStreamsByTeamTest().test();
		new GetAllStreamsByRepoTest().test();
		new InvalidTypeTest().test();
		new NoRepo_IDTest().test();
		new TeamIDRequiredTest().test();
		new GetUnreadStreamsTest().test();
		new GetNoUnreadStreamsTest().test();
		new ACLTest().test();
	}
}

module.exports = GetStreamsRequestTester;
