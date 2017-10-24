'use strict';

var Get_My_File_Stream_Test = require('./get_my_file_stream_test');
var Get_My_Channel_Stream_Test = require('./get_my_channel_stream_test');
var Get_My_Direct_Stream_Test = require('./get_my_direct_stream_test');
var Get_Other_File_Stream_Test = require('./get_other_file_stream_test');
var Get_Other_Channel_Stream_Test = require('./get_other_channel_stream_test');
var Get_Other_Direct_Stream_Test = require('./get_other_direct_stream_test');
var Not_Found_Test = require('./not_found_test');
var ACL_Test = require('./acl_test');

class Get_Stream_Request_Tester {

	get_stream_test () {
		new Get_My_File_Stream_Test().test();
		new Get_My_Channel_Stream_Test().test();
		new Get_My_Direct_Stream_Test().test();
		new Get_Other_File_Stream_Test().test();
		new Get_Other_Channel_Stream_Test().test();
		new Get_Other_Direct_Stream_Test().test();
		new Not_Found_Test().test();
		new ACL_Test({ type: 'channel' }).test();
		new ACL_Test({ type: 'direct' }).test();
		new ACL_Test({ type: 'file' }).test();
	}
}

module.exports = Get_Stream_Request_Tester;
