// tests of the DataCollection class and its functionality

'use strict';

// make jshint happy
/* globals describe */

var GetByIdFromCacheTest = require('./get_by_id_from_cache_test');
var GetByIdFromDatabaseTest = require('./get_by_id_from_database_test');
var GetByIdFromCacheAfterDeletedTest = require('./get_by_id_from_cache_after_deleted_test');
var GetByIdNotFoundTest = require('./get_by_id_not_found_test');
var GetByIdsTest = require('./get_by_ids_test');
var GetByIdsFromQueryCacheTest = require('./get_by_ids_from_query_cache_test');
var GetByQueryTest = require('./get_by_query_test');
var GetByQuerySkipsCacheTest = require('./get_by_query_skips_cache_test');
var GetByQuerySortTest = require('./get_by_query_sort_test');
var GetByQueryLimitTest = require('./get_by_query_limit_test');
var GetOneByQueryTest = require('./get_one_by_query_test');
var GetOneByQuerySkipsCacheTest = require('./get_one_by_query_skips_cache_test');
var CreateAndPersistTest = require('./create_and_persist_test');
var CreateWithoutPersistTest = require('./create_without_persist_test');
var UpdateNoIdTest = require('./update_no_id_test');
var UpdateToCacheTest = require('./update_to_cache_test');
var UpdateToDatabaseTest = require('./update_to_database_test');
var UpsertToCacheTest = require('./upsert_to_cache_test');
var UpsertToDatabaseTest = require('./upsert_to_database_test');
var UpsertOpToCacheTest = require('./upsert_op_to_cache_test');
var UpsertOpToDatabaseTest = require('./upsert_op_to_database_test');
var ApplySetToCacheTest = require('./apply_set_to_cache_test');
var ApplySetToDatabaseTest = require('./apply_set_to_database_test');
var ApplySetSubObjectToCacheTest = require('./apply_set_sub_object_to_cache_test');
var ApplySetSubObjectToDatabaseTest = require('./apply_set_sub_object_to_database_test');
var ApplyUnsetToCacheTest = require('./apply_unset_to_cache_test');
var ApplyUnsetToDatabaseTest = require('./apply_unset_to_database_test');
var ApplyUnsetSubObjectToCacheTest = require('./apply_unset_sub_object_to_cache_test');
var ApplyUnsetSubObjectToDatabaseTest = require('./apply_unset_sub_object_to_database_test');
var ApplyAddToCacheTest = require('./apply_add_to_cache_test');
var ApplyAddToDatabaseTest = require('./apply_add_to_database_test');
var ApplyAddArrayToCacheTest = require('./apply_add_array_to_cache_test');
var ApplyAddArrayToDatabaseTest = require('./apply_add_array_to_database_test');
var ApplyNoAddToCacheTest = require('./apply_no_add_to_cache_test');
var ApplyNoAddToDatabaseTest = require('./apply_no_add_to_database_test');
var ApplyPushToCacheTest = require('./apply_push_to_cache_test');
var ApplyPushToDatabaseTest = require('./apply_push_to_database_test');
var ApplyPullToCacheTest = require('./apply_pull_to_cache_test');
var ApplyPullToDatabaseTest = require('./apply_pull_to_database_test');
var ApplyNoPullToCacheTest = require('./apply_no_pull_to_cache_test');
var ApplyNoPullToDatabaseTest = require('./apply_no_pull_to_database_test');
var ApplyIncToCacheTest = require('./apply_inc_to_cache_test');
var ApplyIncToDatabaseTest = require('./apply_inc_to_database_test');
var UpdateDirectTest = require('./update_direct_test');
var DeleteFromCacheTest = require('./delete_from_cache_test');
var DeleteFromDatabaseTest = require('./delete_from_database_test');
var FindAndModifyTest = require('./find_and_modify_test');

/* jshint -W071 */

describe('dataCollection', function() {

	new GetByIdFromCacheTest().test();
	new GetByIdFromDatabaseTest().test();
	new GetByIdFromCacheAfterDeletedTest().test();
	new GetByIdNotFoundTest().test();
	new GetByIdsTest().test();
	new GetByIdsFromQueryCacheTest().test();
	new GetByQueryTest().test();
	new GetByQuerySkipsCacheTest().test();
	new GetByQuerySortTest().test();
	new GetByQueryLimitTest().test();
	new GetOneByQueryTest().test();
	new GetOneByQuerySkipsCacheTest().test();
	new CreateAndPersistTest().test();
	new CreateWithoutPersistTest().test();
	new UpdateNoIdTest().test();
	new UpdateToCacheTest().test();
	new UpdateToDatabaseTest().test();
	new UpsertToCacheTest().test();
	new UpsertToDatabaseTest().test();
	new UpsertOpToCacheTest().test();
	new UpsertOpToDatabaseTest().test();
	new ApplySetToCacheTest().test();
	new ApplySetToDatabaseTest().test();
	new ApplySetSubObjectToCacheTest().test();
	new ApplySetSubObjectToDatabaseTest().test();
	new ApplyUnsetToCacheTest().test();
	new ApplyUnsetToDatabaseTest().test();
	new ApplyUnsetSubObjectToCacheTest().test();
	new ApplyUnsetSubObjectToDatabaseTest().test();
	new ApplyAddToCacheTest().test();
	new ApplyAddToDatabaseTest().test();
	new ApplyAddArrayToCacheTest().test();
	new ApplyAddArrayToDatabaseTest().test();
	new ApplyNoAddToCacheTest().test();
	new ApplyNoAddToDatabaseTest().test();
	new ApplyPushToCacheTest().test();
	new ApplyPushToDatabaseTest().test();
	new ApplyPullToCacheTest().test();
	new ApplyPullToDatabaseTest().test();
	new ApplyNoPullToCacheTest().test();
	new ApplyNoPullToDatabaseTest().test();
	new ApplyIncToCacheTest().test();
	new ApplyIncToDatabaseTest().test();
	new UpdateDirectTest().test();
	new DeleteFromCacheTest().test();
	new DeleteFromDatabaseTest().test();
	new FindAndModifyTest().test();

});

/* jshint +W071 */
