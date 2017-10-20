'use strict';

var Get_Streams_By_Id_Test = require('./get_streams_by_id_test');
var Get_File_Streams_By_Repo_Test = require('./get_file_streams_by_repo_test');
var Get_Channel_Streams_By_Team_Test = require('./get_channel_streams_by_team_test');
var Get_Direct_Streams_By_Team_Test = require('./get_direct_streams_by_team_test');
var Get_All_Streams_By_Team_Test = require('./get_all_streams_by_team_test');
var Get_All_Streams_By_Repo_Test = require('./get_all_streams_by_repo_test');
var IDs_Required_Test = require('./ids_required_test');
var Invalid_Type_Test = require('./invalid_type_test');
var No_Repo_ID_Test = require('./no_repo_id_test');
var No_Team_ID_For_Channels_Test = require('./no_team_id_for_channels_test');
var No_Team_ID_For_Direct_Test = require('./no_team_id_for_direct_test');
var No_Team_Or_Repo_Test = require('./no_team_or_repo_test');

class Get_Streams_Request_Tester {

	get_streams_test () {
		new Get_Streams_By_Id_Test().test();
		new Get_File_Streams_By_Repo_Test().test();
		new Get_Channel_Streams_By_Team_Test().test();
		new Get_Direct_Streams_By_Team_Test().test();
		new Get_All_Streams_By_Team_Test().test();
		new Get_All_Streams_By_Repo_Test().test();
		new IDs_Required_Test().test();
		new Invalid_Type_Test().test();
		new No_Repo_ID_Test().test();
		new No_Team_ID_For_Channels_Test().test();
		new No_Team_ID_For_Direct_Test().test();
		new No_Team_Or_Repo_Test().test();
	}
}

module.exports = Get_Streams_Request_Tester;
