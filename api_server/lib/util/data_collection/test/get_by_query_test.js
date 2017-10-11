'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Data_Collection_Test = require('./data_collection_test');

class Get_By_Query_Test extends Data_Collection_Test {

	get description () {
		return 'should get the correct models when getting several models by query';
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.create_random_models,
			this.persist,
			this.filter_test_models
		], callback);
	}

	run (callback) {
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

module.exports = Get_By_Query_Test;
