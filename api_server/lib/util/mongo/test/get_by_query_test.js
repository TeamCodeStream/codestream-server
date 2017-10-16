'use strict';

var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Mongo_Test = require('./mongo_test');

class Get_By_Query_Test extends Mongo_Test {

	get description () {
		return 'should get the correct documents when getting several documents by query';
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.create_random_documents,
			this.filter_test_documents
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
