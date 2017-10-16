'use strict';

var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Data_Collection_Test = require('./data_collection_test');

class Delete_From_Cache_Test extends Data_Collection_Test {

	get description () {
		return 'should not get a model after it has been deleted from the cache';
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.create_test_and_control_model,
			this.delete_model
		], callback);
	}

	delete_model (callback) {
		this.data.test.delete_by_id(
			this.test_model.id,
			callback
		);
	}

	run (callback) {
		this.test_models = [this.control_model];
		this.data.test.get_by_ids(
			[this.test_model.id, this.control_model.id],
			(error, response) => {
				this.check_response(error, response, callback);
			}
		);
	}

	validate_response () {
		this.validate_array_response();
	}
}

module.exports = Delete_From_Cache_Test;
