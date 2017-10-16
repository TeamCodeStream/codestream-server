'use strict';

var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Data_Collection_Test = require('./data_collection_test');
var Data_Model = require('../data_model');

class Get_By_Id_From_Database_Test extends Data_Collection_Test {

	get description () {
		return 'should get the correct model when getting a model by ID and it is not cached';
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.create_model_direct
		], callback);
	}

	create_model_direct (callback) {
		this.test_model = new Data_Model({
			text: 'hello',
			number: 12345,
			array: [1, 2, 3, 4, 5]
		});
		this.mongo_data.test.create(
			this.test_model.attributes,
			(error, created_document) => {
				if (error) { return callback(error); }
				this.test_model.id = this.test_model.attributes._id = created_document._id;
				callback();
			}
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

module.exports = Get_By_Id_From_Database_Test;
