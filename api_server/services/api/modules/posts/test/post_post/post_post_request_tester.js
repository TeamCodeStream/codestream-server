'use strict';

var Post_Post_Test = require('./post_post_test');
var Post_To_Direct_Test = require('./post_to_direct_test');
var Post_To_Channel_Test = require('./post_to_channel_test');
var Post_To_File_Stream_Test = require('./post_to_file_stream_test');
var Post_Location_To_File_Stream_Test = require('./post_location_to_file_stream_test');
var Post_Reply_Test = require('./post_reply_test');
var No_Stream_Id_Test = require('./no_stream_id_test');
var Invalid_Stream_Id_Test = require('./invalid_stream_id_test');
var Direct_On_The_Fly_Test = require('./direct_on_the_fly_test');
var Channel_On_The_Fly_Test = require('./channel_on_the_fly_test');
var File_Stream_On_The_Fly_Test = require('./file_stream_on_the_fly_test');
var Invalid_Repo_Id_Test = require('./invalid_repo_id_test');
var No_Stream_Attribute_Test = require('./no_stream_attribute_test');
var Invalid_Team_Id_Test = require('./invalid_team_id_test');
var Duplicate_Channel_Test = require('./duplicate_channel_test');
var Duplicate_Direct_Test = require('./duplicate_direct_test');
var Duplicate_File_Stream_Test = require('./duplicate_file_stream_test');
var Invalid_Type_Test = require('./invalid_type_test');
var Me_Direct_Test = require('./me_direct_test');
var Me_Channel_Test = require('./me_channel_test');
var Name_Required_Test = require('./name_required_test');
var No_File_Test = require('./no_file_test');
var No_Repo_Id_Test = require('./no_repo_id_test');
var ACL_Team_Test = require('./acl_team_test');
var ACL_Stream_Test = require('./acl_stream_test');
var ACL_Team_On_The_Fly_Test = require('./acl_team_on_the_fly_test');
var ACL_Repo_On_The_Fly_Test = require('./acl_repo_on_the_fly_test');
var New_Post_Message_To_Team_Test = require('./new_post_message_to_team_test');
var New_Post_Message_To_Stream_Test = require('./new_post_message_to_stream_test');
var New_Post_No_Message_Test = require('./new_post_no_message_test');
var New_File_Stream_Message_To_Team_Test = require('./new_file_stream_message_to_team_test');
var New_Stream_Message_To_Members_Test = require('./new_stream_message_to_members_test');
var New_Stream_No_Message_Test = require('./new_stream_no_message_test');

/* jshint -W071 */

class Post_Post_Request_Tester {

	post_post_test () {
		new Post_Post_Test().test();
		new Post_To_Direct_Test().test();
		new Post_To_Channel_Test().test();
		new Post_To_File_Stream_Test().test();
		new Post_Location_To_File_Stream_Test().test();
		new Post_Reply_Test().test();
		new No_Stream_Id_Test().test();
		new Invalid_Stream_Id_Test().test();
		new Direct_On_The_Fly_Test().test();
		new Channel_On_The_Fly_Test().test();
		new File_Stream_On_The_Fly_Test().test();
		new Invalid_Repo_Id_Test().test();
		new No_Stream_Attribute_Test({ attribute: 'team_id' }).test();
		new No_Stream_Attribute_Test({ attribute: 'type' }).test();
		new Invalid_Team_Id_Test().test();
		new Duplicate_Channel_Test().test();
		new Duplicate_Direct_Test().test();
		new Duplicate_File_Stream_Test().test();
		new Invalid_Type_Test().test();
		new Me_Direct_Test().test();
		new Me_Channel_Test().test();
		new Name_Required_Test().test();
		new No_File_Test().test();
		new No_Repo_Id_Test().test();
		new ACL_Team_Test({ }).test();
		new ACL_Stream_Test().test();
		new ACL_Team_On_The_Fly_Test().test();
		new ACL_Repo_On_The_Fly_Test().test();
		new New_Post_Message_To_Team_Test().test();
		new New_Post_Message_To_Stream_Test({ type: 'channel' }).test();
		new New_Post_Message_To_Stream_Test({ type: 'direct' }).test();
		new New_Post_No_Message_Test({ type: 'channel' }).test();
		new New_Post_No_Message_Test({ type: 'direct' }).test();
		new New_File_Stream_Message_To_Team_Test().test();
		new New_Stream_Message_To_Members_Test({ type: 'channel' }).test();
		new New_Stream_Message_To_Members_Test({ type: 'direct' }).test();
		new New_Stream_No_Message_Test({ type: 'channel' }).test();
		new New_Stream_No_Message_Test({ type: 'direct' }).test();
	}
}

/* jshint +W071 */

module.exports = Post_Post_Request_Tester;
