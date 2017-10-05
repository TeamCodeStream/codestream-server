'use strict';

// make jshint happy
/* globals describe */

var Get_By_Id_From_Cache_Test = require('./get_by_id_from_cache_test');
var Get_By_Id_From_Database_Test = require('./get_by_id_from_database_test');
var Get_By_Id_From_Cache_After_Deleted_Test = require('./get_by_id_from_cache_after_deleted_test');
var Get_By_Id_Not_Found_Test = require('./get_by_id_not_found_test');
var Get_By_Ids_Test = require('./get_by_ids_test');
var Get_By_Ids_From_Query_Cache_Test = require('./get_by_ids_from_query_cache_test');
var Get_By_Query_Test = require('./get_by_query_test');
var Get_By_Query_Skips_Cache_Test = require('./get_by_query_skips_cache_test');
var Get_By_Query_Sort_Test = require('./get_by_query_sort_test');
var Get_By_Query_Limit_Test = require('./get_by_query_limit_test');
var Get_One_By_Query_Test = require('./get_one_by_query_test');
var Get_One_By_Query_Skips_Cache_Test = require('./get_one_by_query_skips_cache_test');
var Create_And_Persist_Test = require('./create_and_persist_test');
var Create_Without_Persist_Test = require('./create_without_persist_test');
var Update_No_Id_Test = require('./update_no_id_test');
var Update_To_Cache_Test = require('./update_to_cache_test');
var Update_To_Database_Test = require('./update_to_database_test');
var Apply_Set_To_Cache_Test = require('./apply_set_to_cache_test');
var Apply_Set_To_Database_Test = require('./apply_set_to_database_test');
var Apply_Set_Sub_Object_To_Cache_Test = require('./apply_set_sub_object_to_cache_test');
var Apply_Set_Sub_Object_To_Database_Test = require('./apply_set_sub_object_to_database_test');
var Apply_Unset_To_Cache_Test = require('./apply_unset_to_cache_test');
var Apply_Unset_To_Database_Test = require('./apply_unset_to_database_test');
var Apply_Unset_Sub_Object_To_Cache_Test = require('./apply_unset_sub_object_to_cache_test');
var Apply_Unset_Sub_Object_To_Database_Test = require('./apply_unset_sub_object_to_database_test');
var Apply_Add_To_Cache_Test = require('./apply_add_to_cache_test');
var Apply_Add_To_Database_Test = require('./apply_add_to_database_test');
var Apply_No_Add_To_Cache_Test = require('./apply_no_add_to_cache_test');
var Apply_No_Add_To_Database_Test = require('./apply_no_add_to_database_test');
var Apply_Push_To_Cache_Test = require('./apply_push_to_cache_test');
var Apply_Push_To_Database_Test = require('./apply_push_to_database_test');
var Apply_Pull_To_Cache_Test = require('./apply_pull_to_cache_test');
var Apply_Pull_To_Database_Test = require('./apply_pull_to_database_test');
var Apply_No_Pull_To_Cache_Test = require('./apply_no_pull_to_cache_test');
var Apply_No_Pull_To_Database_Test = require('./apply_no_pull_to_database_test');
var Update_Direct_Test = require('./update_direct_test');
var Delete_From_Cache_Test = require('./delete_from_cache_test');
var Delete_From_Database_Test = require('./delete_from_database_test');

describe('data_collection', function() {

	new Get_By_Id_From_Cache_Test().test();
	new Get_By_Id_From_Database_Test().test();
	new Get_By_Id_From_Cache_After_Deleted_Test().test();
	new Get_By_Id_Not_Found_Test().test();
	new Get_By_Ids_Test().test();
	new Get_By_Ids_From_Query_Cache_Test().test();
	new Get_By_Query_Test().test();
	new Get_By_Query_Skips_Cache_Test().test();
	new Get_By_Query_Sort_Test().test();
	new Get_By_Query_Limit_Test().test();
	new Get_One_By_Query_Test().test();
	new Get_One_By_Query_Skips_Cache_Test().test();
	new Create_And_Persist_Test().test();
	new Create_Without_Persist_Test().test();
	new Update_No_Id_Test().test();
	new Update_To_Cache_Test().test();
	new Update_To_Database_Test().test();
	new Apply_Set_To_Cache_Test().test();
	new Apply_Set_To_Database_Test().test();
	new Apply_Set_Sub_Object_To_Cache_Test().test();
	new Apply_Set_Sub_Object_To_Database_Test().test();
	new Apply_Unset_To_Cache_Test().test();
	new Apply_Unset_To_Database_Test().test();
	new Apply_Unset_Sub_Object_To_Cache_Test().test();
	new Apply_Unset_Sub_Object_To_Database_Test().test();
	new Apply_Add_To_Cache_Test().test();
	new Apply_Add_To_Database_Test().test();
	new Apply_No_Add_To_Cache_Test().test();
	new Apply_No_Add_To_Database_Test().test();
	new Apply_Push_To_Cache_Test().test();
	new Apply_Push_To_Database_Test().test();
	new Apply_Pull_To_Cache_Test().test();
	new Apply_Pull_To_Database_Test().test();
	new Apply_No_Pull_To_Cache_Test().test();
	new Apply_No_Pull_To_Database_Test().test();
	new Update_Direct_Test().test();
	new Delete_From_Cache_Test().test();
	new Delete_From_Database_Test().test();

});
