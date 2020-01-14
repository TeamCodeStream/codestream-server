// tests of the DataCollection class and its functionality

'use strict';

// make eslint happy
/* globals describe */

const GetByIdFromCacheTest = require('./get_by_id_from_cache_test');
const GetByIdFromDatabaseTest = require('./get_by_id_from_database_test');
const GetByIdFromCacheAfterDeletedTest = require('./get_by_id_from_cache_after_deleted_test');
const GetByIdNotFoundTest = require('./get_by_id_not_found_test');
const GetByIdsTest = require('./get_by_ids_test');
const GetByIdsSortTest = require('./get_by_ids_sort_test');
const GetByIdsFromQueryCacheTest = require('./get_by_ids_from_query_cache_test');
const GetByQueryTest = require('./get_by_query_test');
const GetByQuerySkipsCacheTest = require('./get_by_query_skips_cache_test');
const GetByQuerySortTest = require('./get_by_query_sort_test');
const GetByQueryLimitTest = require('./get_by_query_limit_test');
const GetOneByQueryTest = require('./get_one_by_query_test');
const GetOneByQuerySkipsCacheTest = require('./get_one_by_query_skips_cache_test');
const CreateAndPersistTest = require('./create_and_persist_test');
const CreateWithoutPersistTest = require('./create_without_persist_test');
const UpdateNoIdTest = require('./update_no_id_test');
const UpdateToCacheTest = require('./update_to_cache_test');
const UpdateToDatabaseTest = require('./update_to_database_test');
const ApplySetToCacheTest = require('./apply_set_to_cache_test');
const ApplySetToDatabaseTest = require('./apply_set_to_database_test');
const ApplySetSubObjectToCacheTest = require('./apply_set_sub_object_to_cache_test');
const ApplySetSubObjectToDatabaseTest = require('./apply_set_sub_object_to_database_test');
const ApplyUnsetToCacheTest = require('./apply_unset_to_cache_test');
const ApplyUnsetToDatabaseTest = require('./apply_unset_to_database_test');
const ApplyUnsetSubObjectToCacheTest = require('./apply_unset_sub_object_to_cache_test');
const ApplyUnsetSubObjectToDatabaseTest = require('./apply_unset_sub_object_to_database_test');
const ApplyAddToCacheTest = require('./apply_add_to_cache_test');
const ApplyAddToDatabaseTest = require('./apply_add_to_database_test');
const ApplyAddArrayToCacheTest = require('./apply_add_array_to_cache_test');
const ApplyAddArrayToDatabaseTest = require('./apply_add_array_to_database_test');
const ApplyNoAddToCacheTest = require('./apply_no_add_to_cache_test');
const ApplyNoAddToDatabaseTest = require('./apply_no_add_to_database_test');
const ApplyPushToCacheTest = require('./apply_push_to_cache_test');
const ApplyPushToDatabaseTest = require('./apply_push_to_database_test');
const ApplyPullToCacheTest = require('./apply_pull_to_cache_test');
const ApplyPullToDatabaseTest = require('./apply_pull_to_database_test');
const ApplyNoPullToCacheTest = require('./apply_no_pull_to_cache_test');
const ApplyNoPullToDatabaseTest = require('./apply_no_pull_to_database_test');
const ApplyIncToCacheTest = require('./apply_inc_to_cache_test');
const ApplyIncToDatabaseTest = require('./apply_inc_to_database_test');
const UpdateDirectTest = require('./update_direct_test');
const UpdateWhenPersistTest = require('./update_when_persist_test');
const DeleteFromCacheTest = require('./delete_from_cache_test');
const DeleteFromDatabaseTest = require('./delete_from_database_test');
const FindAndModifyTest = require('./find_and_modify_test');
const VersionUpdateTest = require('./version_update_test');
const VersionMismatchTest = require('./version_mismatch_test');

describe('dataCollection', function() {

	this.timeout(10000);

	new GetByIdFromCacheTest().test();
	new GetByIdFromDatabaseTest().test();
	new GetByIdFromCacheAfterDeletedTest().test();
	new GetByIdNotFoundTest().test();
	new GetByIdsTest().test();
	new GetByIdsSortTest().test();
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
	new UpdateWhenPersistTest().test();
	new DeleteFromCacheTest().test();
	new DeleteFromDatabaseTest().test();
	new FindAndModifyTest().test();
	new VersionUpdateTest().test();
	new VersionMismatchTest().test();
});
