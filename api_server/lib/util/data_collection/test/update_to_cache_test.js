'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Data_Collection_Test = require('./data_collection_test');

class Update_To_Cache_Test extends Data_Collection_Test {

	get description () {
		return 'should get the correct model after updating a cached model';
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.create_test_model,
			this.update_test_model,
			this.confirm_not_persisted
		], callback);
	}

	run (callback) {
		this.data.test.get_by_id(
			this.test_model.id,
			(error, response) => {
				this.check_response(error, response, callback);
			}
		);
	}

	validate_response () {
		this.validate_model_response();
	}
}

module.exports = Update_To_Cache_Test;
