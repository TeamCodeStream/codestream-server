'use strict';

var Get_Streams_By_Team_Id_And_Ids_Test = require('./get_streams_by_team_id_and_ids_test');
var Get_Streams_By_Repo_Id_And_Ids_Test = require('./get_streams_by_repo_id_and_ids_test');
var Get_Streams_Only_From_Team_Test = require('./get_streams_only_from_team_test');
var Get_Streams_Only_From_Repo_Test = require('./get_streams_only_from_repo_test');
var Get_File_Streams_By_Repo_Test = require('./get_file_streams_by_repo_test');
var Get_Channel_Streams_By_Team_Test = require('./get_channel_streams_by_team_test');
var Get_Direct_Streams_By_Team_Test = require('./get_direct_streams_by_team_test');
var Get_All_Streams_By_Team_Test = require('./get_all_streams_by_team_test');
var Get_All_Streams_By_Repo_Test = require('./get_all_streams_by_repo_test');
var Invalid_Type_Test = require('./invalid_type_test');
var No_Repo_ID_Test = require('./no_repo_id_test');
var Team_ID_Required_Test = require('./team_id_required_test');
var ACL_Test = require('./acl_test');

class Get_Streams_Request_Tester {

	get_streams_test () {
		new Get_Streams_By_Team_Id_And_Ids_Test().test();
		new Get_Streams_By_Repo_Id_And_Ids_Test().test();
		new Get_Streams_Only_From_Team_Test().test();
		new Get_Streams_Only_From_Repo_Test().test();
		new Get_File_Streams_By_Repo_Test().test();
		new Get_Channel_Streams_By_Team_Test().test();
		new Get_Direct_Streams_By_Team_Test().test();
		new Get_All_Streams_By_Team_Test().test();
		new Get_All_Streams_By_Repo_Test().test();
		new Invalid_Type_Test().test();
		new No_Repo_ID_Test().test();
		new Team_ID_Required_Test().test();
		new ACL_Test().test();
	}
}

module.exports = Get_Streams_Request_Tester;
