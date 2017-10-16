'use strict';

var Data_Collection_Test = require('./data_collection_test');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class Create_And_Persist_Test extends Data_Collection_Test {

	get description () {
		return 'should create a model that can then be fetched from the database by its ID after it is persisted';
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.create_test_and_control_model,
			this.persist,
			this.clear_cache
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

module.exports = Create_And_Persist_Test;
