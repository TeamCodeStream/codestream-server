'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Data_Collection_Test = require('./data_collection_test');

class Get_One_By_Query_Test extends Data_Collection_Test {

	get_description () {
		return 'should get the correct model when getting one model by query';
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.create_random_models,
			this.persist,
			this.clear_cache
		], callback);
	}

	run (callback) {
		this.test_model = this.models[4];
		this.data.test.get_one_by_query(
			{
				text: this.test_model.get('text'),
				flag: this.test_model.get('flag')
			},
			(error, response) => {
				this.check_response(error, response, callback);
			}
		);
	}

	validate_response () {
		this.validate_model_response();
	}
}

module.exports = Get_One_By_Query_Test;
