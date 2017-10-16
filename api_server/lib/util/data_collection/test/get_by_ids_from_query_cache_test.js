'use strict';

var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Data_Collection_Test = require('./data_collection_test');

class Get_By_Ids_From_Query_Cache_Test extends Data_Collection_Test {

	get description () {
		return 'should get the correct models when getting several models by ID, when models have been fetched by a query then cached';
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.create_random_models,
			this.filter_test_models,
			this.persist,
			this.clear_cache,
			this.query_models,
			this.delete_models
		], callback);
	}

	query_models (callback) {
		this.data.test.get_by_query(
			{ flag: this.randomizer + 'yes' },
			(error, response) => {
				if (error) { return callback(error); }
				if (!(response instanceof Array || response.length !== this.test_models.length)) {
					return callback('models that should have been fetched were not');
				}
				callback();
			}
		);
	}

	delete_models (callback) {
		let ids = this.test_models.map(model => { return model.id; });
		this.mongo_data.test.delete_by_ids(
			ids,
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

module.exports = Get_By_Ids_From_Query_Cache_Test;
