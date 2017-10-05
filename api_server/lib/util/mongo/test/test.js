'use strict';

// make jshint happy
/* globals describe */

var Get_By_Id_Test = require('./get_by_id_test');
var Get_By_Id_Not_Found_Test = require('./get_by_id_not_found_test');
var Get_By_Ids_Test = require('./get_by_ids_test');
var Get_By_Query_Test = require('./get_by_query_test');
var Get_By_Query_Sort_Test = require('./get_by_query_sort_test');
var Get_By_Query_Limit_Test = require('./get_by_query_limit_test');
var Get_One_By_Query_Test = require('./get_one_by_query_test');
var Create_Test = require('./create_test');
var Create_Many_Test = require('./create_many_test');
var Update_Test = require('./update_test');
var Update_By_Id_Test = require('./update_by_id_test');
var Update_No_Id_Test = require('./update_no_id_test');
var Apply_Set_By_Id_Test = require('./apply_set_by_id_test');
var Apply_Set_Sub_Object_By_Id_Test = require('./apply_set_sub_object_by_id_test');
var Apply_Unset_By_Id_Test = require('./apply_unset_by_id_test');
var Apply_Unset_Sub_Object_By_Id_Test = require('./apply_unset_sub_object_by_id_test');
var Apply_Add_By_Id_Test = require('./apply_add_by_id_test');
var Apply_No_Add_By_Id_Test = require('./apply_no_add_by_id_test');
var Apply_Push_By_Id_Test = require('./apply_push_by_id_test');
var Apply_Pull_By_Id_Test = require('./apply_pull_by_id_test');
var Apply_No_Pull_By_Id_Test = require('./apply_no_pull_by_id_test');
var Apply_Ops_By_Id_Test = require('./apply_ops_by_id_test');
var Update_Direct_Test = require('./update_direct_test');
var Delete_By_Id_Test = require('./delete_by_id_test');
var Delete_By_Ids_Test = require('./delete_by_ids_test');
var Delete_By_Query_Test = require('./delete_by_query_test');

describe('mongo', function() {

	new Get_By_Id_Test().test();
	new Get_By_Id_Not_Found_Test().test();
	new Get_By_Ids_Test().test();
	new Get_By_Query_Test().test();
	new Get_By_Query_Sort_Test().test();
	new Get_By_Query_Limit_Test().test();
	new Get_One_By_Query_Test().test();
	new Create_Test().test();
	new Create_Many_Test().test();
	new Update_Test().test();
	new Update_By_Id_Test().test();
	new Update_No_Id_Test().test();
	new Apply_Set_By_Id_Test().test();
	new Apply_Set_Sub_Object_By_Id_Test().test();
	new Apply_Unset_By_Id_Test().test();
	new Apply_Unset_Sub_Object_By_Id_Test().test();
	new Apply_Add_By_Id_Test().test();
	new Apply_No_Add_By_Id_Test().test();
	new Apply_Push_By_Id_Test().test();
	new Apply_Pull_By_Id_Test().test();
	new Apply_No_Pull_By_Id_Test().test();
	new Apply_Ops_By_Id_Test().test();
	new Update_Direct_Test().test();
	new Delete_By_Id_Test().test();
	new Delete_By_Ids_Test().test();
	new Delete_By_Query_Test().test();

});
