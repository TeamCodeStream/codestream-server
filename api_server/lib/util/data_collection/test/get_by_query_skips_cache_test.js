'use strict';

var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Data_Collection_Test = require('./data_collection_test');

class Get_By_Query_Skips_Cache_Test extends Data_Collection_Test {

	get description () {
		return 'should get no models when fetching several models by query, when those models have not yet been persisted';
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.create_random_models,
			this.filter_test_models,
			this.confirm_in_cache
		], callback);
	}

	confirm_in_cache (callback) {
		let ids = this.test_models.map(model => { return model.id; });
		this.data.test.get_by_ids(
			ids,
			(error, response) => {
				if (error) { return callback(error); }
				if (!(response instanceof Array || response.length !== this.test_models.length)) {
					return callback('models that should be cached were not fetched');
				}
				callback();
			}
		);
	}

	run (callback) {
		this.test_models = [];
		this.data.test.get_by_query(
			{ flag: this.randomizer + 'yes' },
			(error, response) => {
				this.check_response(error, response, callback);
			}
		);
	}

	validate_response () {
		this.validate_array_response();
	}
}

module.exports = Get_By_Query_Skips_Cache_Test;
