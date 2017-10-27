'use strict';

var Get_Posts_Test = require('./get_posts_test');
var Get_Posts_By_Me_Test = require('./get_posts_by_me_test');
var Get_Posts_By_Other_Test = require('./get_posts_by_other_test');
var Get_Posts_Newer_Than_Test = require('./get_posts_newer_than_test');
var Get_Child_Posts_Test = require('./get_child_posts_test');
var Get_Posts_By_Id_Test = require('./get_posts_by_id_test');
var Get_Posts_Limit_Test = require('./get_posts_limit_test');
var Get_Posts_Sort_Test = require('./get_posts_sort_test');
var Get_Posts_Default_Sort_Test = require('./get_posts_default_sort_test');
var Get_Posts_Greater_Than_Test = require('./get_posts_greater_than_test');
var Get_Posts_Greater_Than_Equal_Test = require('./get_posts_greater_than_equal_test');
var Get_Posts_Less_Than_Test = require('./get_posts_less_than_test');
var Get_Posts_Less_Than_Equal_Test = require('./get_posts_less_than_equal_test');
var Pagination_Test = require('./pagination_test');
var Invalid_Parameter_Test = require('./invalid_parameter_test');
var One_Relational_Test = require('./one_relational_test');
var Invalid_ID_Test = require('./invalid_id_test');
var Team_ID_Required_Test = require('./team_id_required_test');
var Stream_ID_Required_Test = require('./stream_id_required_test');
var ACL_Team_Test = require('./acl_team_test');
var ACL_Stream_Test = require('./acl_stream_test');
var ACL_Team_File_Test = require('./acl_team_file_test');
var Stream_Not_Found_Test = require('./stream_not_found_test');
var Stream_No_Match_Team_Test = require('./stream_no_match_team_test');

/* jshint -W071 */

class Get_Posts_Request_Tester {

	get_posts_test () {

		new Get_Posts_Test({type: 'channel'}).test();
		new Get_Posts_Test({type: 'direct'}).test();
		new Get_Posts_Test({type: 'file'}).test();
		new Get_Posts_By_Me_Test().test();
		new Get_Posts_By_Other_Test().test();
		new Get_Posts_Newer_Than_Test().test();
		new Get_Child_Posts_Test().test();
		new Get_Posts_By_Id_Test().test();
		new Get_Posts_Limit_Test().test();
		new Get_Posts_Sort_Test().test();
		new Get_Posts_Default_Sort_Test().test();
		new Get_Posts_Greater_Than_Test().test();
		new Get_Posts_Greater_Than_Equal_Test().test();
		new Get_Posts_Less_Than_Test().test();
		new Get_Posts_Less_Than_Equal_Test().test();
		new Pagination_Test().test();
		new Pagination_Test({ascending: true}).test();
		new Pagination_Test({default_pagination: true}).test();
		new Pagination_Test({default_pagination: true, ascending: true}).test();
		new Pagination_Test({default_pagination: true, try_over_limit: 150}).test();
		new Invalid_Parameter_Test().test();
		new One_Relational_Test().test();
		new Invalid_ID_Test().test();
		new Team_ID_Required_Test().test();
		new Stream_ID_Required_Test().test();
		new ACL_Team_Test().test();
		new ACL_Stream_Test().test();
		new ACL_Team_File_Test().test();
		new Stream_Not_Found_Test().test();
		new Stream_No_Match_Team_Test().test();
	}
}

/* jshint +W071 */

module.exports = Get_Posts_Request_Tester;
