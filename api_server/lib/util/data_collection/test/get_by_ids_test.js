'use strict';

var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Data_Collection_Test = require('./data_collection_test');

class Get_By_Ids_Test extends Data_Collection_Test {

	get description () {
		return 'should get the correct models when getting several models by ID, including models from cache and from database';
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.create_random_models,
			this.filter_test_models,
			this.persist,
			this.clear_cache,
			this.get_some_test_models
		], callback);
	}

	get_some_test_models (callback) {
		let ids = this.test_models.map(model => { return model.id; });
		let some_ids = [...ids].splice(Math.trunc(ids.length / 2));
		if (some_ids.length >= ids.length) {
			return callback('not enough models to run this test');
		}
		this.data.test.get_by_ids(
			some_ids,
			callback
		);
	}

	run (callback) {
		let ids = this.test_models.map(model => { return model.id; });
		this.data.test.get_by_ids(
			ids,
			(error, response) => {
				this.check_response(error, response, callback);
			}
		);
	}

	validate_response () {
		this.validate_array_response();
	}
}

module.exports = Get_By_Ids_Test;
