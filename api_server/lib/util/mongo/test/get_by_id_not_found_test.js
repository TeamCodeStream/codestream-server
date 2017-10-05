'use strict';

var Mongo_Test = require('./mongo_test');
var Assert = require('assert');

class Get_By_Id_Not_Found_Test extends Mongo_Test {

	get_description () {
		return 'should get null when getting document that does not exist';
	}

	run (callback) {
		var next_id = this.data.test.create_id();
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
