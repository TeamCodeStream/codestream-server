'use strict';

var Data_Collection_Test = require('./data_collection_test');
var Assert = require('assert');

class Get_By_Id_Not_Found_Test extends Data_Collection_Test {

	get description () {
		return 'should get null when getting model that does not exist';
	}

	run (callback) {
		let next_id = this.data.test.create_id();
		this.data.test.get_by_id(
			next_id,
			(error, response) => {
				this.check_response(error, response, callback);
			}
		);
	}

	validate_response () {
		Assert(this.response === null, 'response must be null');
	}
}

module.exports = Get_By_Id_Not_Found_Test;
