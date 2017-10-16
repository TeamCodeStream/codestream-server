'use strict';

var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Data_Collection_Test = require('./data_collection_test');

class Get_By_Id_From_Cache_After_Deleted_Test extends Data_Collection_Test {

	get description () {
		return 'should get the correct model when getting a model by ID and it is cached, even if deleted in the database';
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.create_test_model,
			this.persist,
			this.clear_cache,
			this.get_model,
			this.delete_model
		], callback);
	}

	get_model (callback) {
		this.data.test.get_by_id(
			this.test_model.id,
			callback
		);
	}

	delete_model (callback) {
		this.mongo_data.test.delete_by_id(
			this.test_model.id,
			callback
		);
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

module.exports = Get_By_Id_From_Cache_After_Deleted_Test;
