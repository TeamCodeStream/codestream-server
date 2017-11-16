'use strict';

// make jshint happy
/* globals describe */

var GetByIdTest = require('./get_by_id_test');
var GetByIdNotFoundTest = require('./get_by_id_not_found_test');
var GetByIdsTest = require('./get_by_ids_test');
var GetByQueryTest = require('./get_by_query_test');
var GetByQuerySortTest = require('./get_by_query_sort_test');
var GetByQueryLimitTest = require('./get_by_query_limit_test');
var GetOneByQueryTest = require('./get_one_by_query_test');
var CreateTest = require('./create_test');
var CreateManyTest = require('./create_many_test');
var UpdateTest = require('./update_test');
var UpdateByIdTest = require('./update_by_id_test');
var UpdateNoIdTest = require('./update_no_id_test');
var ApplySetByIdTest = require('./apply_set_by_id_test');
var ApplySetSubObjectByIdTest = require('./apply_set_sub_object_by_id_test');
var ApplyUnsetByIdTest = require('./apply_unset_by_id_test');
var ApplyUnsetSubObjectByIdTest = require('./apply_unset_sub_object_by_id_test');
var ApplyAddByIdTest = require('./apply_add_by_id_test');
var ApplyNoAddByIdTest = require('./apply_no_add_by_id_test');
var ApplyPushByIdTest = require('./apply_push_by_id_test');
var ApplyPullByIdTest = require('./apply_pull_by_id_test');
var ApplyNoPullByIdTest = require('./apply_no_pull_by_id_test');
var ApplyOpsByIdTest = require('./apply_ops_by_id_test');
var UpdateDirectTest = require('./update_direct_test');
var DeleteByIdTest = require('./delete_by_id_test');
var DeleteByIdsTest = require('./delete_by_ids_test');
var DeleteByQueryTest = require('./delete_by_query_test');

/* jshint -W071 */

describe('mongo', function() {

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
	new ApplyOpsByIdTest().test();
	new UpdateDirectTest().test();
	new DeleteByIdTest().test();
	new DeleteByIdsTest().test();
	new DeleteByQueryTest().test();

});

/* jshint +W071 */
