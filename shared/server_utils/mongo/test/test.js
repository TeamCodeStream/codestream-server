// tests of the MongoCollection class, the MongoClient class, and related functionality

'use strict';

// make eslint happy
/* globals describe */

const GetByIdTest = require('./get_by_id_test');
const GetByIdNotFoundTest = require('./get_by_id_not_found_test');
const GetByIdsTest = require('./get_by_ids_test');
const GetByQueryTest = require('./get_by_query_test');
const GetByQuerySortTest = require('./get_by_query_sort_test');
const GetByQueryLimitTest = require('./get_by_query_limit_test');
const GetOneByQueryTest = require('./get_one_by_query_test');
const CreateTest = require('./create_test');
const CreateManyTest = require('./create_many_test');
const UpdateTest = require('./update_test');
const UpdateByIdTest = require('./update_by_id_test');
const UpdateNoIdTest = require('./update_no_id_test');
const ApplySetByIdTest = require('./apply_set_by_id_test');
const ApplySetSubObjectByIdTest = require('./apply_set_sub_object_by_id_test');
const ApplyUnsetByIdTest = require('./apply_unset_by_id_test');
const ApplyUnsetSubObjectByIdTest = require('./apply_unset_sub_object_by_id_test');
const ApplyAddByIdTest = require('./apply_add_by_id_test');
const ApplyNoAddByIdTest = require('./apply_no_add_by_id_test');
const ApplyPushByIdTest = require('./apply_push_by_id_test');
const ApplyPullByIdTest = require('./apply_pull_by_id_test');
const ApplyNoPullByIdTest = require('./apply_no_pull_by_id_test');
const UpdateDirectTest = require('./update_direct_test');
const DeleteByIdTest = require('./delete_by_id_test');
const DeleteByIdsTest = require('./delete_by_ids_test');
const DeleteByQueryTest = require('./delete_by_query_test');
const ApplyIncByIdTest = require('./apply_inc_by_id_test');
const ApplyNewIncByIdTest = require('./apply_new_inc_by_id_test');
const UpsertTest = require('./upsert_test');
const ApplyUpsertOpTest = require('./apply_upsert_op_test');
const FindAndModifyTest = require('./find_and_modify_test');
const ApplyWithVersionTest = require('./apply_with_version_test');
const VersionMismatchTest = require('./version_mismatch_test');
const GetByIdFieldsTest = require('./get_by_id_fields_test');
const GetByIdExcludeFieldsTest = require('./get_by_id_exclude_fields_test');
const GetByIdsFieldsTest = require('./get_by_ids_fields_test');
const GetByIdsExcludeFieldsTest = require('./get_by_ids_exclude_fields_test');
const GetByQueryFieldsTest = require('./get_by_query_fields_test');
const GetByQueryExcludeFieldsTest = require('./get_by_query_exclude_fields_test');

describe('mongo', function() {

	this.timeout(5000);

	new GetByIdTest().test();
	new GetByIdNotFoundTest().test();
	new GetByIdsTest().test();
	new GetByQueryTest().test();
	new GetByQuerySortTest().test();
	new GetByQueryLimitTest().test();
	new GetOneByQueryTest().test();
	new CreateTest().test();
	new CreateManyTest().test();
	new UpdateTest().test();
	new UpdateByIdTest().test();
	new UpdateNoIdTest().test();
	new ApplySetByIdTest().test();
	new ApplySetSubObjectByIdTest().test();
	new ApplyUnsetByIdTest().test();
	new ApplyUnsetSubObjectByIdTest().test();
	new ApplyAddByIdTest().test();
	new ApplyNoAddByIdTest().test();
	new ApplyPushByIdTest().test();
	new ApplyPullByIdTest().test();
	new ApplyNoPullByIdTest().test();
	new UpdateDirectTest().test();
	new DeleteByIdTest().test();
	new DeleteByIdsTest().test();
	new DeleteByQueryTest().test();
	new ApplyIncByIdTest().test();
	new ApplyNewIncByIdTest().test();
	new UpsertTest().test();
	new ApplyUpsertOpTest().test();
	new FindAndModifyTest().test();
	new ApplyWithVersionTest().test();
	new VersionMismatchTest().test();
	new GetByIdFieldsTest().test();
	new GetByIdExcludeFieldsTest().test();
	new GetByIdsFieldsTest().test();
	new GetByIdsExcludeFieldsTest().test();
	new GetByQueryFieldsTest().test();
	new GetByQueryExcludeFieldsTest().test();
});
