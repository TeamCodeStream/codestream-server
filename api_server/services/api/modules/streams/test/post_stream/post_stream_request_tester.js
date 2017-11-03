'use strict';

var Post_File_Stream_Test = require('./post_file_stream_test');
var Post_Channel_Stream_Test = require('./post_channel_stream_test');
var Post_Direct_Stream_Test = require('./post_direct_stream_test');
var No_Attribute_Test = require('./no_attribute_test');
var Invalid_Type_Test = require('./invalid_type_test');
var Name_Required_Test = require('./name_required_test');
var No_Repo_Id_Test = require('./no_repo_id_test');
var No_File_Test = require('./no_file_test');
var Channel_Ignores_File_Test = require('./channel_ignores_file_test');
var File_Ignores_Channel_Test = require('./file_ignores_channel_test');
var Direct_Ignores_File_Test = require('./direct_ignores_file_test');
var Direct_Ignores_Channel_Test = require('./direct_ignores_channel_test');
var Me_Direct_Test = require('./me_direct_test');
var Me_Channel_Test = require('./me_channel_test');
var Duplicate_Channel_Test = require('./duplicate_channel_test');
var Duplicate_Direct_Test = require('./duplicate_direct_test');
var Duplicate_File_Test = require('./duplicate_file_test');
var ACL_Test = require('./acl_test');
var New_File_Stream_Message_To_Team_Test = require('./new_file_stream_message_to_team_test');
var New_Stream_To_Members_Test = require('./new_stream_to_members_test');
var New_Stream_No_Message_Test = require('./new_stream_no_message_test');

/* jshint -W071 */

class Post_Stream_Request_Tester {

	post_stream_test () {
		new Post_File_Stream_Test().test();
		new Post_Channel_Stream_Test().test();
		new Post_Direct_Stream_Test().test();
		new No_Attribute_Test({ attribute: 'team_id' }).test();
		new No_Attribute_Test({ attribute: 'type' }).test();
		new Invalid_Type_Test().test();
		new Name_Required_Test().test();
		new No_Repo_Id_Test().test();
		new No_File_Test().test();
		new Channel_Ignores_File_Test().test();
		new File_Ignores_Channel_Test().test();
		new Direct_Ignores_File_Test().test();
		new Direct_Ignores_Channel_Test().test();
		new Me_Direct_Test().test();
		new Me_Channel_Test().test();
		new Duplicate_Channel_Test().test();
		new Duplicate_Direct_Test().test();
		new Duplicate_File_Test().test();
		new ACL_Test({ type: 'channel' }).test();
		new ACL_Test({ type: 'direct' }).test();
		new ACL_Test({ type: 'file' }).test();
		new New_File_Stream_Message_To_Team_Test().test();
		new New_Stream_To_Members_Test({ type: 'direct' }).test();
		new New_Stream_To_Members_Test({ type: 'channel' }).test();
		new New_Stream_No_Message_Test({ type: 'direct' }).test();
		new New_Stream_No_Message_Test({ type: 'channel' }).test();
	}
}

/* jshint +W071 */

module.exports = Post_Stream_Request_Tester;
