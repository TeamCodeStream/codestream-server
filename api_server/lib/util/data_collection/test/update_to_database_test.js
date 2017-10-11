'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Data_Collection_Test = require('./data_collection_test');

class Update_To_Database_Test extends Data_Collection_Test {

	get description () {
		return 'should get the correct model after updating a model and persisting';
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.create_test_model,
			this.persist,
			this.clear_cache,
			this.update_test_model,
			this.persist
		], callback);
	}

	run (callback) {
		this.mongo_data.test.get_by_id(
			this.test_model.id,
			(error, response) => {
				this.check_response(error, response, callback);
			}
		);
	}

	validate_response () {
		this.validate_object_response();
	}
}

module.exports = Update_To_Database_Test;
