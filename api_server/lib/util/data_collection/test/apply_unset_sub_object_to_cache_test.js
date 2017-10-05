'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Update_To_Cache_Test = require('./update_to_cache_test');

class Apply_Unset_Sub_Object_To_Cache_Test extends Update_To_Cache_Test {

	get_description () {
		return 'should get the correct model after applying a sub-object unset to a cached model';
	}

	update_test_model (callback) {
		var unset = {
			'object.y': true
		};
		this.data.test.apply_op_by_id(
			this.test_model.id,
			{ unset: unset },
			(error) => {
				if (error) { return callback(error); }
				delete this.test_model.attributes.object.y;
				callback();
			}
		);
	}
}

module.exports = Apply_Unset_Sub_Object_To_Cache_Test;
