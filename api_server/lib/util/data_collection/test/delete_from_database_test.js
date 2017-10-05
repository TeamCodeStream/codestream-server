'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Data_Collection_Test = require('./data_collection_test');
var Assert = require('assert');

class Delete_From_Database_Test extends Data_Collection_Test {

	get_description () {
		return 'should not get a model after it has been deleted and persisted';
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.create_test_and_control_model,
			this.delete_model,
			this.persist
		], callback);
	}

	delete_model (callback) {
		this.data.test.delete_by_id(
			this.test_model.id,
			callback
		);
	}

	run (callback) {
		this.test_models = [this.control_model];
		this.mongo_data.test.get_by_ids(
			[this.test_model.id, this.control_model.id],
			(error, response) => {
				this.check_response(error, response, callback);
			}
		);
	}

	validate_response () {
		Assert(this.response instanceof Array, 'response must be an array');
		let test_objects = this.test_models.map(model => { return model.attributes; });
		this.response.sort((a, b) => {
			return a.number - b.number;
		});
		Assert.deepEqual(this.response, test_objects, 'fetched models don\'t match');
	}
}

module.exports = Delete_From_Database_Test;
